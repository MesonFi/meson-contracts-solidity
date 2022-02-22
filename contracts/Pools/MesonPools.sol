// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "./IMesonPoolsEvents.sol";
import "../utils/MesonStates.sol";

/// @title MesonPools
/// @notice The class to manage liquidity pools for providers.
/// Methods in this class will be executed when a swap initiator wants to
/// swap into this chain.
contract MesonPools is IMesonPoolsEvents, MesonStates {
    /// @notice Locked Swaps
  /// key: encodedSwap in format of `amount:uint96|salt:uint32|fee:uint40|expireTs:uint40|outChain:uint16|outToken:uint8|inChain:uint16|inToken:uint8`
  /// value: in format of until:uint40|providerIndex:uint40|initiator:uint160
  mapping(uint256 => uint240) internal _lockedSwaps;

  /// @notice Deposit tokens into the liquidity pool and register an index 
  /// for future use (will save gas).
  /// This is the prerequisite for LPs if they want to participate in swap trades.
  /// @param amount The amount to be added to the pool
  /// @param balanceIndex In format of `tokenIndex:uint8|providerIndex:uint40` to save gas
  function depositAndRegister(uint256 amount, uint48 balanceIndex) external {
    require(amount > 0, 'Amount must be positive');

    address provider = _msgSender();
    uint40 providerIndex = uint40(balanceIndex);
    require(providerIndex != 0, "Cannot use 0 as provider index");
    require(addressOfIndex[providerIndex] == address(0), "Index already registered");
    require(indexOfAddress[provider] == 0, "Address already registered");
    addressOfIndex[providerIndex] = provider;
    indexOfAddress[provider] = providerIndex;

    _tokenBalanceOf[balanceIndex] += amount;
    _unsafeDepositToken(_tokenList[uint8(balanceIndex >> 40)], provider, amount);
  }

  /// @notice Deposit tokens into the liquidity pool.
  /// The LP should be careful to make sure the `balanceIndex` is correct.
  /// Make sure to call `depositAndRegister` first and register a provider index.
  /// Otherwise, token may be deposited to others.
  /// @dev Designed to be used by liquidity providers
  /// @param amount The amount to be added to the pool
  /// @param balanceIndex In format of`[tokenIndex:uint8][providerIndex:uint40]
  function deposit(uint256 amount, uint48 balanceIndex) external {
    require(amount > 0, 'Amount must be positive');
    _tokenBalanceOf[balanceIndex] += amount;
    _unsafeDepositToken(_tokenList[uint8(balanceIndex >> 40)], _msgSender(), amount);
  }

  /// @notice Withdraw tokens from the liquidity pool.
  /// @dev Designed to be used by liquidity providers
  /// @param amount The amount to be removed from the pool
  /// @param tokenIndex The index of the withdrawing token
  function withdraw(uint256 amount, uint8 tokenIndex) external {
    address provider = _msgSender();
    uint40 providerIndex = indexOfAddress[provider];
    require(providerIndex != 0, 'Caller not registered. Call depositAndRegister');

    uint48 balanceIndex = (uint48(tokenIndex) << 40) | providerIndex;
    _tokenBalanceOf[balanceIndex] -= amount;
    _safeTransfer(_tokenList[tokenIndex], provider, amount);
  }

  /// @notice Lock funds to match a swap request. This is step 2 in a swap.
  /// The bonding LP should call this method with the same signature given
  /// by `postSwap`. This method will lock swapping fund on the target chain
  /// for `LOCK_TIME_PERIOD` and wait for fund release and execution.
  /// @dev Designed to be used by liquidity providers
  /// @param encodedSwap Encoded swap information; also used as the key of `_lockedSwaps`
  /// @param r Part of the signature (the one given by `postSwap` call)
  /// @param s Part of the signature (the one given by `postSwap` call)
  /// @param v Part of the signature (the one given by `postSwap` call)
  /// @param initiator Swap initiator
  function lock(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address initiator
  ) external forTargetChain(encodedSwap) {
    require(_lockedSwaps[encodedSwap] == 0, "Swap already exists");
    _checkRequestSignature(encodedSwap, r, s, v, initiator);

    uint40 providerIndex = indexOfAddress[_msgSender()];
    require(providerIndex != 0, "Caller not registered. Call depositAndRegister.");

    uint48 balanceIndex = uint48((encodedSwap & 0xFF000000) << 16) | providerIndex;
    _tokenBalanceOf[balanceIndex] -= encodedSwap >> 160;
    
    _lockedSwaps[encodedSwap] = (uint240(block.timestamp + LOCK_TIME_PERIOD) << 200)
      | (uint240(providerIndex) << 160)
      | uint160(initiator);

    emit SwapLocked(encodedSwap);
  }

  /// @notice If the locked swap is not released after `LOCK_TIME_PERIOD`,
  /// the LP can call this method to unlock the swapping fund.
  function unlock(uint256 encodedSwap) external {
    uint240 lockedSwap = _lockedSwaps[encodedSwap];
    require(lockedSwap != 0, "Swap does not exist");
    require(uint240(block.timestamp << 200) > lockedSwap, "Swap still in lock");

    uint48 balanceIndex = uint48((encodedSwap & 0xFF000000) << 16) | uint40(lockedSwap >> 160);
    _tokenBalanceOf[balanceIndex] += encodedSwap >> 160;
    _lockedSwaps[encodedSwap] = 0;
  }

  /// @notice Release tokens to satisfy a locked swap. This is step 3️⃣  in a swap.
  /// This method requires a release signature from the swap initiator,
  /// but anyone (initiator herself, the LP, and other people) with the signature 
  /// can call it to make sure the swapping fund is guaranteed to be released.
  /// @dev Designed to be used by anyone
  /// @param encodedSwap Encoded swap information; also used as the key of `_lockedSwaps`
  /// @param r Part of the release signature (same as in the `executeSwap` call)
  /// @param s Part of the release signature (same as in the `executeSwap` call)
  /// @param v Part of the release signature (same as in the `executeSwap` call)
  /// @param recipient The recipient address of the swap
  function release(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address recipient
  ) external {
    uint240 lockedSwap = _lockedSwaps[encodedSwap];
    require(lockedSwap != 0, "Swap does not exist");

    _checkReleaseSignature(encodedSwap, keccak256(abi.encodePacked(recipient)), r, s, v, address(uint160(lockedSwap)));
    _lockedSwaps[encodedSwap] = 0;

    address token = _tokenList[uint8(encodedSwap >> 24)];
    _safeTransfer(token, recipient, encodedSwap >> 160);

    emit SwapReleased(encodedSwap);
  }

  /// @notice Read information for a locked swap
  function getLockedSwap(uint256 encodedSwap) external view
    returns (address initiator, address provider, uint40 until)
  {
    uint240 lockedSwap = _lockedSwaps[encodedSwap];
    initiator = address(uint160(lockedSwap));
    provider = addressOfIndex[uint40(lockedSwap >> 160)];
    until = uint40(lockedSwap >> 200);
  }

  modifier forTargetChain(uint256 encodedSwap) {
    require(uint16(encodedSwap >> 32) == SHORT_COIN_TYPE, "Swap not for this chain");
    _;
  }
}
