// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../libraries/LowGasSafeMath.sol";

import "./IMesonPoolsEvents.sol";
import "../utils/MesonStates.sol";

/// @title MesonPools
/// @notice The class to manage liquidity pools for providers.
/// Methods in this class will be executed by LPs when users want to
/// swap into the current chain.
contract MesonPools is IMesonPoolsEvents, MesonStates {
  mapping(uint256 => uint240) internal _lockedSwaps;

  function depositAndRegister(uint128 amount, uint48 balanceIndex) external {
    require(amount > 0, 'Amount must be positive');

    address provider = _msgSender();
    uint40 providerIndex = uint40(balanceIndex);
    require(providerIndex != 0, "Cannot use 0 as provider index");
    require(addressOfIndex[providerIndex] == address(0), "Index already registered");
    require(indexOfAddress[provider] == 0, "Address already registered");
    addressOfIndex[providerIndex] = provider;
    indexOfAddress[provider] = providerIndex;

    _tokenBalanceOf[balanceIndex] = LowGasSafeMath.add(_tokenBalanceOf[balanceIndex], amount);
    _unsafeDepositToken(_tokenList[uint8(balanceIndex >> 40)], provider, uint256(amount));
  }

  /// @notice Deposit tokens into the liquidity pool. This is the
  /// prerequisite for LPs if they want to participate in swap
  /// trades.
  /// The LP should be careful to make sure the `balanceIndex` is correct.
  /// Make sure to call `depositAndRegister` first and register a provider index.
  /// Otherwise, token may be deposited to others.
  /// @dev Designed to be used by liquidity providers
  /// @param amount The amount to be added to the pool
  /// @param balanceIndex `[tokenIndex:uint8][providerIndex:uint40]
  function deposit(uint128 amount, uint48 balanceIndex) external {
    require(amount > 0, 'Amount must be positive');
    _tokenBalanceOf[balanceIndex] = LowGasSafeMath.add(_tokenBalanceOf[balanceIndex], amount);
    _unsafeDepositToken(_tokenList[uint8(balanceIndex >> 40)], _msgSender(), uint256(amount));
  }

  /// @notice Withdraw tokens from the liquidity pool. In order to make sure
  /// pending swaps can be satisfied, withdraw have a rate limit that
  /// in each epoch, total amounts to release (to users) and withdraw
  /// (to LP himself) cannot exceed MAX_RELEASE_AMOUNT_BY_EPOCH.
  /// This method will only run in the current epoch. Use `release`
  /// if wish to increment epoch.
  /// @dev Designed to be used by liquidity providers
  /// @param amount The amount to be removed from the pool
  /// @param tokenIndex The contract address of the withdrawing token
  function withdraw(uint128 amount, uint8 tokenIndex) external {
    address provider = _msgSender();
    uint40 providerIndex = indexOfAddress[provider];
    require(providerIndex != 0, 'Caller not registered. Call depositAndRegister');

    uint48 index = (uint48(tokenIndex) << 40) | providerIndex;
    _tokenBalanceOf[index] = LowGasSafeMath.sub(_tokenBalanceOf[index], amount);
    _safeTransfer(_tokenList[tokenIndex], provider, uint256(amount));
  }

  function lock(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address initiator
  ) external {
    require(_lockedSwaps[encodedSwap] == 0, "Swap already exists");
    bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", encodedSwap));
    require(initiator == ecrecover(bytes32(digest), v, r, s), "Invalid signature");

    uint40 providerIndex = indexOfAddress[_msgSender()];
    require(providerIndex != 0, "Caller not registered. Call depositAndRegister.");
    uint128 amount;
    uint48 balanceIndex;
    uint256 until = block.timestamp + LOCK_TIME_PERIOD;
    uint240 lockedSwap;
    assembly {
      mstore(32, initiator) // store initiator@[44-64)
      mstore(12, providerIndex) // store providerIndex@[39-44)
      mstore(7, shr(8, encodedSwap)) // store encodedSwap@[8-39) where amount@[8-24) & outToken@38
      amount := shr(64, mload(0)) // load amount@[8-24) (read 0-32 and right shift 8 bytes)
      balanceIndex := mload(12) // load [38-44) which is outToken|providerIndex
      mstore(7, until) // store until@[34-39)
      lockedSwap := mload(32) // load [34-64) which is until|providerIndex|initiator
    }

    _tokenBalanceOf[balanceIndex] = LowGasSafeMath.sub(_tokenBalanceOf[balanceIndex], amount);
    _lockedSwaps[encodedSwap] = lockedSwap;

    emit SwapLocked(encodedSwap);
  }

  function unlock(uint256 encodedSwap) external {
    uint240 lockedSwap = _lockedSwaps[encodedSwap];
    require(lockedSwap != 0, "Swap does not exist");

    require(uint240(block.timestamp << 200) > lockedSwap, "Swap still in lock");

    uint128 amount = uint128(encodedSwap >> 128);
    uint8 tokenIndex = uint8(encodedSwap >> 8);

    uint48 balanceIndex = (uint48(tokenIndex) << 40) | uint40(lockedSwap >> 160);
    _tokenBalanceOf[balanceIndex] = LowGasSafeMath.add(_tokenBalanceOf[balanceIndex], amount);
    _lockedSwaps[encodedSwap] = 0;
  }

  /// @notice Release tokens to satisfy a user's swap request.
  /// This is step 3️⃣  in a swap.
  /// The LP should call this first before calling `executeSwap`.
  /// Otherwise, other people can use the signature to challenge the LP.
  /// For a single swap, signature given here is identical to the one used
  /// in `executeSwap`.
  /// @dev Designed to be used by liquidity providers
  function release(
    uint256 encodedSwap,
    bytes32 domainHash,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address recipient
  ) external {
    uint240 lockedSwap = _lockedSwaps[encodedSwap];
    require(lockedSwap != 0, "Swap does not exist");

    _checkReleaseSignature(encodedSwap, recipient, domainHash, r, s, v, address(uint160(lockedSwap)));

    address token = _tokenList[uint8(encodedSwap >> 8)];
    _safeTransfer(token, recipient, encodedSwap >> 128);

    _lockedSwaps[encodedSwap] = 0;
    emit SwapReleased(encodedSwap);
  }

  function getLockedSwap(uint256 encodedSwap) external view
    returns (address initiator, address provider, uint40 until)
  {
    uint240 lockedSwap = _lockedSwaps[encodedSwap];
    initiator = address(uint160(lockedSwap));
    provider = addressOfIndex[uint40(lockedSwap >> 160)];
    until = uint40(lockedSwap >> 200);
  }
}
