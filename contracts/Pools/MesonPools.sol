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
  /// key: encodedSwap in format of `amount:uint48|salt:uint80|fee:uint40|expireTs:uint40|outChain:uint16|outToken:uint8|inChain:uint16|inToken:uint8`
  /// value: in format of until:uint40|providerIndex:uint40
  mapping(bytes32 => uint80) internal _lockedSwaps;

  /// @notice Deposit tokens into the liquidity pool and register an index 
  /// for future use (will save gas).
  /// This is the prerequisite for LPs if they want to participate in swap trades.
  /// @param amount The amount to be added to the pool
  /// @param balanceIndex In format of `tokenIndex:uint8|providerIndex:uint40` to save gas
  function depositAndRegister(uint256 amount, uint48 balanceIndex) external {
    require(amount > 0, 'Amount must be positive');

    address provider = _msgSender();
    uint40 providerIndex = _providerIndexFromBalanceIndex(balanceIndex);
    require(providerIndex != 0, "Cannot use 0 as provider index");
    require(addressOfIndex[providerIndex] == address(0), "Index already registered");
    require(indexOfAddress[provider] == 0, "Address already registered");
    addressOfIndex[providerIndex] = provider;
    indexOfAddress[provider] = providerIndex;

    _tokenBalanceOf[balanceIndex] += amount;
    _unsafeDepositToken(_tokenList[_tokenIndexFromBalanceIndex(balanceIndex)], provider, amount);
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
    _unsafeDepositToken(_tokenList[_tokenIndexFromBalanceIndex(balanceIndex)], _msgSender(), amount);
  }

  /// @notice Withdraw tokens from the liquidity pool.
  /// @dev Designed to be used by liquidity providers
  /// @param amount The amount to be removed from the pool
  /// @param tokenIndex The index of the withdrawing token
  function withdraw(uint256 amount, uint8 tokenIndex) external {
    address provider = _msgSender();
    uint40 providerIndex = indexOfAddress[provider];
    require(providerIndex != 0, 'Caller not registered. Call depositAndRegister');

    _tokenBalanceOf[_balanceIndexFrom(tokenIndex, providerIndex)] -= amount;
    _safeTransfer(_tokenList[tokenIndex], provider, amount);
  }

  /// @notice Lock funds to match a swap request. This is step 2 in a swap.
  /// The bonding LP should call this method with the same signature given
  /// by `postSwap`. This method will lock swapping fund on the target chain
  /// for `LOCK_TIME_PERIOD` and wait for fund release and execution.
  /// @dev Designed to be used by liquidity providers
  /// @param encodedSwap Encoded swap information
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
    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    require(_lockedSwaps[swapId] == 0, "Swap already exists");
    _checkRequestSignature(encodedSwap, r, s, v, initiator);

    uint40 providerIndex = indexOfAddress[_msgSender()];
    require(providerIndex != 0, "Caller not registered. Call depositAndRegister.");

    uint256 until = block.timestamp + LOCK_TIME_PERIOD;
    require(until < _expireTsFrom(encodedSwap), "Cannot lock because expireTs is soon.");

    uint48 balanceIndex = _outTokenBalanceIndexFrom(encodedSwap, providerIndex);
    _tokenBalanceOf[balanceIndex] -= _amountFrom(encodedSwap);
    
    _lockedSwaps[swapId] = _lockedSwapFrom(until, providerIndex);

    emit SwapLocked(encodedSwap);
  }

  /// @notice If the locked swap is not released after `LOCK_TIME_PERIOD`,
  /// the LP can call this method to unlock the swapping fund.
  function unlock(uint256 encodedSwap, address initiator) external {
    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    uint80 lockedSwap = _lockedSwaps[swapId];
    require(lockedSwap != 0, "Swap does not exist");
    require(_untilFromLocked(lockedSwap) < block.timestamp, "Swap still in lock");

    uint48 balanceIndex = _outTokenBalanceIndexFrom(encodedSwap, _providerIndexFromLocked(lockedSwap));
    _tokenBalanceOf[balanceIndex] += _amountFrom(encodedSwap);
    _lockedSwaps[swapId] = 0;
  }

  /// @notice Release tokens to satisfy a locked swap. This is step 3️⃣  in a swap.
  /// This method requires a release signature from the swap initiator,
  /// but anyone (initiator herself, the LP, and other people) with the signature 
  /// can call it to make sure the swapping fund is guaranteed to be released.
  /// @dev Designed to be used by anyone
  /// @param encodedSwap Encoded swap information
  /// @param r Part of the release signature (same as in the `executeSwap` call)
  /// @param s Part of the release signature (same as in the `executeSwap` call)
  /// @param v Part of the release signature (same as in the `executeSwap` call)
  /// @param recipient The recipient address of the swap
  function release(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address initiator,
    address recipient
  ) external {
    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    uint80 lockedSwap = _lockedSwaps[swapId];
    require(lockedSwap != 0, "Swap does not exist");

    _checkReleaseSignature(encodedSwap, keccak256(abi.encodePacked(recipient)), r, s, v, initiator);
    _lockedSwaps[swapId] = 0;

    address token = _tokenList[_outTokenIndexFrom(encodedSwap)];
    _safeTransfer(token, recipient, _amountFrom(encodedSwap));

    emit SwapReleased(encodedSwap);
  }

  /// @notice Read information for a locked swap
  function getLockedSwap(uint256 encodedSwap, address initiator) external view
    returns (address provider, uint40 until)
  {
    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    uint80 lockedSwap = _lockedSwaps[swapId];
    provider = addressOfIndex[_providerIndexFromLocked(lockedSwap)];
    until = uint40(_untilFromLocked(lockedSwap));
  }

  modifier forTargetChain(uint256 encodedSwap) {
    require(_outChainFrom(encodedSwap) == SHORT_COIN_TYPE, "Swap not for this chain");
    _;
  }
}
