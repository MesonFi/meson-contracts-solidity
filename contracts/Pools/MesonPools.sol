// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "./IMesonPoolsEvents.sol";
import "../utils/MesonStates.sol";

/// @title MesonPools
/// @notice The class to manage pools for LPs.
/// Methods in this class will be executed when a swap initiator wants to
/// swap into this chain.
contract MesonPools is IMesonPoolsEvents, MesonStates {
  /// @notice Locked Swaps
  /// key: encodedSwap in format of `amount:uint48|salt:uint80|fee:uint40|expireTs:uint40|outChain:uint16|outToken:uint8|inChain:uint16|inToken:uint8`
  /// value: in format of until:uint40|poolIndex:uint40
  /// TODO: define all variables
  /// salt 0x__________
  ///   salt & 0x4000000000 == true => will waive service fee
  ///   salt & 0x0800000000 == true => use non-typed signing (some wallet such as hardware wallet don't support EIP-712v1)
  ///   fee means the fee for liquidity provider. An extra service fee maybe charged
  mapping(bytes32 => uint80) internal _lockedSwaps;

  /// @notice Initially deposit tokens into an LP pool and register a pool index.
  /// This is the prerequisite for LPs if they want to participate in Meson swaps.
  /// @param amount The amount of tokens to be added to the pool
  /// @param poolTokenIndex In format of `tokenIndex:uint8|poolIndex:uint40` to save gas
  function depositAndRegister(uint256 amount, uint48 poolTokenIndex) external {
    require(amount > 0, 'Amount must be positive');

    address poolOwner = _msgSender();
    uint40 poolIndex = _poolIndexFrom(poolTokenIndex);
    require(poolIndex != 0, "Cannot use 0 as pool index");
    require(ownerOfPool[poolIndex] == address(0), "Pool index already registered");
    require(poolOfAuthorizedAddr[poolOwner] == 0, "Signer address already registered");
    ownerOfPool[poolIndex] = poolOwner;
    poolOfAuthorizedAddr[poolOwner] = poolIndex;

    _balanceOfPoolToken[poolTokenIndex] += amount;
    uint8 tokenIndex = _tokenIndexFrom(poolTokenIndex);
    _unsafeDepositToken(_tokenList[tokenIndex], poolOwner, amount, tokenIndex == 255);
  }

  /// @notice Deposit tokens into the liquidity pool.
  /// The LP should be careful to make sure the `poolTokenIndex` is correct.
  /// Make sure to call `depositAndRegister` first and register a pool index.
  /// Otherwise, token may be deposited to others.
  /// @dev Designed to be used by LPs
  /// @param amount The amount of tokens to be added to the pool
  /// @param poolTokenIndex In format of `tokenIndex:uint8|poolIndex:uint40`
  function deposit(uint256 amount, uint48 poolTokenIndex) external {
    require(amount > 0, 'Amount must be positive');

    uint40 poolIndex = _poolIndexFrom(poolTokenIndex);
    require(poolIndex != 0, "Cannot use 0 as pool index");
    require(ownerOfPool[poolIndex] == _msgSender(), "Need the pool owner as the signer");
    _balanceOfPoolToken[poolTokenIndex] += amount;
    uint8 tokenIndex = _tokenIndexFrom(poolTokenIndex);
    _unsafeDepositToken(_tokenList[tokenIndex], _msgSender(), amount, tokenIndex == 255);
  }

  /// @notice Withdraw tokens from the liquidity pool.
  /// @dev Designed to be used by LPs
  /// @param amount The amount to be removed from the pool
  /// @param poolTokenIndex In format of`[tokenIndex:uint8][poolIndex:uint40]
  function withdraw(uint256 amount, uint48 poolTokenIndex) external {
    require(amount > 0, 'Amount must be positive');

    uint40 poolIndex = _poolIndexFrom(poolTokenIndex);
    require(poolIndex != 0, "Cannot use 0 as pool index");
    require(ownerOfPool[poolIndex] == _msgSender(), "Need the pool owner as the signer");
    _balanceOfPoolToken[poolTokenIndex] -= amount;
    uint8 tokenIndex = _tokenIndexFrom(poolTokenIndex);
    _safeTransfer(_tokenList[tokenIndex], _msgSender(), amount, tokenIndex == 255);
  }

  /// @notice Lock funds to match a swap request. This is step 2 in a swap.
  /// The bonding LP should call this method with the same signature given
  /// by `postSwap`. This method will lock swapping fund on the target chain
  /// for `LOCK_TIME_PERIOD` and wait for fund release and execution.
  /// @dev Designed to be used by LPs
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

    uint40 poolIndex = poolOfAuthorizedAddr[_msgSender()];
    require(poolIndex != 0, "Caller not registered. Call depositAndRegister.");

    uint256 until = block.timestamp + LOCK_TIME_PERIOD;
    require(until < _expireTsFrom(encodedSwap), "Cannot lock because expireTs is soon.");

    uint48 poolTokenIndex = _poolTokenIndexForOutToken(encodedSwap, poolIndex);
    // TODO only (amount-fee) is locked
    _balanceOfPoolToken[poolTokenIndex] -= (_amountFrom(encodedSwap) - _feeForLp(encodedSwap));
    
    _lockedSwaps[swapId] = _lockedSwapFrom(until, poolIndex);

    emit SwapLocked(encodedSwap);
  }

  /// @notice If the locked swap is not released after `LOCK_TIME_PERIOD`,
  /// the LP can call this method to unlock the swapping fund.
  function unlock(uint256 encodedSwap, address initiator) external {
    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    uint80 lockedSwap = _lockedSwaps[swapId];
    require(lockedSwap != 0, "Swap does not exist");
    require(_untilFromLocked(lockedSwap) < block.timestamp, "Swap still in lock");

    uint48 poolTokenIndex = _poolTokenIndexForOutToken(encodedSwap, _poolIndexFromLocked(lockedSwap));
    // TODO only (amount-fee) is locked
    _balanceOfPoolToken[poolTokenIndex] += (_amountFrom(encodedSwap) - _feeForLp(encodedSwap));
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
  /// @param initiator The initiator of the swap
  /// @param recipient The recipient address of the swap
  function release(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address initiator,
    address recipient
  ) external {
    bool feeWaived = _feeWaived(encodedSwap);
    if (feeWaived) {
      // TODO: for swaps that service fee is waived, only the premium manager can....
      _onlyPremiumManager();
    }
    // TODO: for normal swaps, anyone can call

    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    uint80 lockedSwap = _lockedSwaps[swapId];
    require(lockedSwap != 0, "Swap does not exist");
    require(_expireTsFrom(encodedSwap) > block.timestamp, "Cannot release because expired");

    _checkReleaseSignature(encodedSwap, recipient, r, s, v, initiator);
    _lockedSwaps[swapId] = 0;

    uint8 tokenIndex = _outTokenIndexFrom(encodedSwap);
    // TODO
    uint256 releaseAmount = _amountFrom(encodedSwap) - _feeForLp(encodedSwap);
    if (!feeWaived) {
      uint256 serviceFee = _serviceFee(encodedSwap); // TODO: serviceFee = 0.1% * amount
      // TODO: 
      releaseAmount -= serviceFee;
      _balanceOfPoolToken[_poolTokenIndexForOutToken(encodedSwap, 0)] += serviceFee; // TODO: the pool for service fees
    }

    _safeTransfer(_tokenList[tokenIndex], recipient, releaseAmount, tokenIndex == 255);

    emit SwapReleased(encodedSwap);
  }

  function _onlyPremiumManager() internal view virtual {}

  /// @notice Read information for a locked swap
  function getLockedSwap(uint256 encodedSwap, address initiator) external view
    returns (address poolOwner, uint40 until)
  {
    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    uint80 lockedSwap = _lockedSwaps[swapId];
    poolOwner = ownerOfPool[_poolIndexFromLocked(lockedSwap)];
    until = uint40(_untilFromLocked(lockedSwap));
  }

  modifier forTargetChain(uint256 encodedSwap) {
    require(_outChainFrom(encodedSwap) == SHORT_COIN_TYPE, "Swap not for this chain");
    _;
  }
}
