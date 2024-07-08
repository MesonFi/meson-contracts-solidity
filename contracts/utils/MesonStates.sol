// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/utils/Address.sol";
import "../interfaces/IERC20Minimal.sol";
import "../interfaces/IDepositWithBeneficiary.sol";
import "./MesonTokens.sol";
import "./MesonHelpers.sol";

/// @title MesonStates
/// @notice The class that keeps track of LP pool states
contract MesonStates is MesonTokens, MesonHelpers {
  bytes4 private constant ERC20_TRANSFER_SELECTOR = bytes4(keccak256("transfer(address,uint256)"));
  bytes4 private constant ERC20_TRANSFER_FROM_SELECTOR = bytes4(keccak256("transferFrom(address,address,uint256)"));

  /// @notice The mapping from *authorized addresses* to LP pool indexes.
  /// See `ownerOfPool` to understand how pool index is defined and used.
  ///
  /// This mapping records the relation between *authorized addresses* and pool indexes, where
  /// authorized addresses are those who have the permision to match and complete a swap with funds 
  /// in a pool with specific index. For example, for an LP pool with index `i` there could be multiple
  /// addresses that `poolOfAuthorizedAddr[address] = i`, which means these addresses can all sign to match
  /// (call `bondSwap`, `lock`) a swap and complete it (call `release`) with funds in pool `i`. That helps
  /// an LP to give other addresses the permission to perform daily swap transactions. However, authorized
  /// addresses cannot withdraw funds from the LP pool, unless it's given in `ownerOfPool` which records
  /// the *owner* address for each pool.
  ///
  /// The pool index 0 is reserved for use by Meson
  mapping(address => uint40) public poolOfAuthorizedAddr;

  /// @notice The mapping from LP pool indexes to their owner addresses.
  /// Each LP pool in Meson has a uint40 index `i` and each LP needs to register an pool index at
  /// initial deposit by calling `depositAndRegister`. The balance for each LP pool is tracked by its
  /// pool index and token index (see `_balanceOfPoolToken`).
  /// 
  /// This mapping records the *owner* address for each LP pool. Only the owner address can withdraw funds
  /// from its corresponding LP pool.
  ///
  /// The pool index 0 is reserved for use by Meson
  mapping(uint40 => address) public ownerOfPool;

  /// @notice Balance for each token in LP pool, tracked by the `poolTokenIndex`.
  /// See `ownerOfPool` to understand how pool index is defined and used.
  ///
  /// The balance of a token in an LP pool is `_balanceOfPoolToken[poolTokenIndex]` in which
  /// the `poolTokenIndex` is in format of `tokenIndex:uint8|poolIndex:uint40`. `tokenIndex`
  /// is the index of supported tokens given by `tokenForIndex` (see definition in `MesonTokens.sol`).
  /// The balances are always store as tokens have decimal 6, which is the case for USDC/USDT on most chains
  /// except BNB Smart Chain & Conflux. In the exceptional cases, the value of token amount will be converted
  /// on deposit and withdrawal (see `_safeTransfer` and `_unsafeDepositToken` in `MesonHelpers.sol`).
  ///
  /// The pool index 0 is reserved for use by Meson to store service fees
  mapping(uint48 => uint256) internal _balanceOfPoolToken;

  /// @dev This empty reserved space is put in place to allow future versions to
  /// add new variables without shifting down storage in the inheritance chain.
  /// See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
  uint256[50] private __gap;

  function poolTokenBalance(address token, address addr) external view returns (uint256) {
    uint8 tokenIndex = indexOfToken[token];
    uint40 poolIndex = poolOfAuthorizedAddr[addr];
    if (poolIndex == 0 || tokenIndex == 0) {
      return 0;
    }
    return _balanceOfPoolToken[_poolTokenIndexFrom(tokenIndex, poolIndex)];
  }
  
  /// @notice The collected service fee of a specific token.
  /// @param tokenIndex The index of a supported token. See `tokenForIndex` in `MesonTokens.sol`
  function serviceFeeCollected(uint8 tokenIndex) external view returns (uint256) {
    return _balanceOfPoolToken[_poolTokenIndexFrom(tokenIndex, 0)];
  }

  /// @notice Help the senders to transfer their assets to the Meson contract
  /// @param tokenIndex The index of token. See `tokenForIndex` in `MesonTokens.sol`
  /// @param sender The sender of the transfer
  /// @param amount The value of the transfer (always in decimal 6)
  function _unsafeDepositToken(
    uint8 tokenIndex,
    address sender,
    uint256 amount
  ) internal {
    require(amount > 0, "Amount must be greater than zero");

    if (_isCoreToken(tokenIndex)) {
      // Core tokens (e.g. ETH or BNB)
      require(amount * 1e12 == msg.value, "msg.value does not match the amount");
    } else {
      // Stablecoins
      address token = tokenForIndex[tokenIndex];

      require(token != address(0), "Token not supported");
      require(Address.isContract(token), "The given token address is not a contract");

      amount *= _amountFactor(tokenIndex);
      (bool success, bytes memory data) = token.call(abi.encodeWithSelector(
        ERC20_TRANSFER_FROM_SELECTOR,
        sender,
        address(this),
        amount
      ));
      require(success && (data.length == 0 || abi.decode(data, (bool))), "transferFrom failed");
    }
  }

  /// @notice Safe transfers tokens from Meson contract to a recipient
  /// for interacting with ERC20 tokens that do not consistently return true/false
  /// @param tokenIndex The index of token. See `tokenForIndex` in `MesonTokens.sol`
  /// @param recipient The recipient of the transfer
  /// @param amount The value of the transfer (always in decimal 6)
  function _safeTransfer(
    uint8 tokenIndex,
    address recipient,
    uint256 amount
  ) internal {
    if (_isCoreToken(tokenIndex)) {
      // Core tokens (e.g. ETH or BNB)
      _transferCoreToken(recipient, amount);
    } else {
      // Stablecoins
      address token = tokenForIndex[tokenIndex];

      require(Address.isContract(token), "The given token address is not a contract");

      amount *= _amountFactor(tokenIndex);
      if (SHORT_COIN_TYPE == 0x00c3) {
        IERC20Minimal(token).transfer(recipient, amount);
      } else {
        // This doesn't works on Tron
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(
          ERC20_TRANSFER_SELECTOR,
          recipient,
          amount
        ));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "transfer failed");
      }
    }
  }

  function _transferCoreToken(address recipient, uint256 amount) internal {
    (bool success, ) = recipient.call{value: amount * 1e12}("");
    require(success, "Transfer failed");
  }

  /// @notice Transfer tokens to a contract using `depositWithBeneficiary`
  /// @param tokenIndex The index of token. See `tokenForIndex` in `MesonTokens.sol`
  /// @param contractAddr The smart contract address that will receive transferring tokens
  /// @param beneficiary The beneficiary of `depositWithBeneficiary`
  /// @param amount The value of the transfer (always in decimal 6)
  /// @param data Extra data passed to the contract
  function _transferToContract(
    uint8 tokenIndex,
    address contractAddr,
    address beneficiary,
    uint256 amount,
    uint64 data
  ) internal {
    require(Address.isContract(contractAddr), "The given recipient address is not a contract");

    amount *= _amountFactor(tokenIndex);
    if (_isCoreToken(tokenIndex)) {
      // Core tokens (e.g. ETH or BNB)
      IDepositWithBeneficiary(contractAddr).depositWithBeneficiary{value: amount}(
        address(0),
        amount,
        beneficiary,
        data
      );
    } else {
      // Stablecoins
      address token = tokenForIndex[tokenIndex];
      require(Address.isContract(token), "The given token address is not a contract");
      
      IERC20Minimal(token).approve(contractAddr, amount);
      IDepositWithBeneficiary(contractAddr).depositWithBeneficiary(
        token,
        amount,
        beneficiary,
        data
      );
    }
  }

  /// @notice Determine if token has decimal 18 and therefore need to adjust amount
  /// @param tokenIndex The index of token. See `tokenForIndex` in `MesonTokens.sol`
  function _amountFactor(uint8 tokenIndex) private pure returns (uint256) {
    if (tokenIndex <= 32) {
      return 1;
    } else if (tokenIndex == 242 && SHORT_COIN_TYPE != 0x02ca && SHORT_COIN_TYPE != 0x1771) {
      return 100;
    } else if (tokenIndex > 112 && tokenIndex <= 128) {
      return 100;
    }
    return 1e12;
  }
}
