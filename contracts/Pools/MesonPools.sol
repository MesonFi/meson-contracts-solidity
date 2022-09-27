// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./IMesonPoolsEvents.sol";
import "../utils/MesonStates.sol";

/// @title MesonPools
/// @notice The class to manage pools for LPs, and perform swap operations on the target 
/// chain side.
/// Methods in this class will be executed when a user wants to swap into this chain.
/// LP pool operations are also provided in this class.
contract MesonPools is IMesonPoolsEvents, MesonStates {
  /// @notice Locked Swaps
  /// key: `swapId` is calculated from `encodedSwap` and `initiator`. See `_getSwapId` in `MesonHelpers.sol`
  ///   encodedSwap: see `MesonSwap.sol` for defination;
  ///   initiator: The user address who created and signed the swap request.
  /// value: `lockedSwap` in format of `until:uint40|poolIndex:uint40`
  ///   until: The expiration time of this swap on the target chain. Need to `release` the swap fund before `until`;
  ///   poolIndex: The index of an LP pool. See `ownerOfPool` in `MesonStates.sol` for more information.
  mapping(bytes32 => uint80) internal _lockedSwaps;

  /// @dev This empty reserved space is put in place to allow future versions to
  /// add new variables without shifting down storage in the inheritance chain.
  /// See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
  uint256[50] private __gap;

  /// @notice Initially deposit tokens into an LP pool and register a pool index.
  /// This is the prerequisite for LPs if they want to participate in Meson swaps.
  /// @dev Designed to be used by a new address who wants to be an LP and register a pool index
  /// @param amount The amount of tokens to be added to the pool
  /// @param poolTokenIndex In format of `tokenIndex:uint8|poolIndex:uint40`. See `_balanceOfPoolToken` in `MesonStates.sol` for more information.
  function depositAndRegister(uint256 amount, uint48 poolTokenIndex) external {
    require(amount > 0, "Amount must be positive");

    address poolOwner = _msgSender();
    uint40 poolIndex = _poolIndexFrom(poolTokenIndex);
    require(poolIndex != 0, "Cannot use 0 as pool index"); // pool 0 is reserved for meson service fee
    require(ownerOfPool[poolIndex] == address(0), "Pool index already registered");
    require(poolOfAuthorizedAddr[poolOwner] == 0, "Signer address already registered");
    ownerOfPool[poolIndex] = poolOwner;
    poolOfAuthorizedAddr[poolOwner] = poolIndex;

    _balanceOfPoolToken[poolTokenIndex] += amount;
    uint8 tokenIndex = _tokenIndexFrom(poolTokenIndex);
    _unsafeDepositToken(tokenForIndex[tokenIndex], poolOwner, amount, tokenIndex);

    emit PoolRegistered(poolIndex, poolOwner);
    emit PoolDeposited(poolTokenIndex, amount);
  }

  /// @notice Deposit tokens into the liquidity pool.
  /// The LP should be careful to make sure the `poolTokenIndex` is correct.
  /// Make sure to call `depositAndRegister` first and register a pool index.
  /// Otherwise, token may be deposited to others.
  /// @dev Designed to be used by addresses authorized to a pool
  /// @param amount The amount of tokens to be added to the pool
  /// @param poolTokenIndex In format of `tokenIndex:uint8|poolIndex:uint40`. See `_balanceOfPoolToken` in `MesonStates.sol` for more information.
  function deposit(uint256 amount, uint48 poolTokenIndex) external {
    require(amount > 0, "Amount must be positive");

    uint40 poolIndex = _poolIndexFrom(poolTokenIndex);
    require(poolIndex != 0, "Cannot use 0 as pool index"); // pool 0 is reserved for meson service fee
    require(poolIndex == poolOfAuthorizedAddr[_msgSender()], "Need an authorized address as the signer");
    _balanceOfPoolToken[poolTokenIndex] += amount;
    uint8 tokenIndex = _tokenIndexFrom(poolTokenIndex);
    _unsafeDepositToken(tokenForIndex[tokenIndex], _msgSender(), amount, tokenIndex);

    emit PoolDeposited(poolTokenIndex, amount);
  }

  /// @notice Withdraw tokens from the liquidity pool.
  /// @dev Designed to be used by LPs (pool owners) who have already registered a pool index
  /// @param amount The amount to be removed from the pool
  /// @param poolTokenIndex In format of `tokenIndex:uint8|poolIndex:uint40. See `_balanceOfPoolToken` in `MesonStates.sol` for more information.
  function withdraw(uint256 amount, uint48 poolTokenIndex) external {
    require(amount > 0, "Amount must be positive");

    uint40 poolIndex = _poolIndexFrom(poolTokenIndex);
    require(poolIndex != 0, "Cannot use 0 as pool index"); // pool 0 is reserved for meson service fee
    require(ownerOfPool[poolIndex] == _msgSender(), "Need the pool owner as the signer");
    _balanceOfPoolToken[poolTokenIndex] -= amount;
    uint8 tokenIndex = _tokenIndexFrom(poolTokenIndex);
    _safeTransfer(tokenForIndex[tokenIndex], _msgSender(), amount, tokenIndex);

    emit PoolWithdrawn(poolTokenIndex, amount);
  }

  /// @notice Add an authorized address to the pool
  /// @dev Designed to be used by LPs (pool owners)
  /// @param addr The address to be added
  function addAuthorizedAddr(address addr) external {
    require(poolOfAuthorizedAddr[addr] == 0, "Addr is authorized for another pool");
    address poolOwner = _msgSender();
    uint40 poolIndex = poolOfAuthorizedAddr[poolOwner];
    require(poolIndex != 0, "The signer does not register a pool");
    require(poolOwner == ownerOfPool[poolIndex], "Need the pool owner as the signer");
    poolOfAuthorizedAddr[addr] = poolIndex;

    emit PoolAuthorizedAddrAdded(poolIndex, addr);
  }
  
  /// @notice Remove an authorized address from the pool
  /// @dev Designed to be used by LPs (pool owners)
  /// @param addr The address to be removed
  function removeAuthorizedAddr(address addr) external {
    address poolOwner = _msgSender();
    uint40 poolIndex = poolOfAuthorizedAddr[poolOwner];
    require(poolIndex != 0, "The signer does not register a pool");
    require(poolOwner == ownerOfPool[poolIndex], "Need the pool owner as the signer");
    require(poolOfAuthorizedAddr[addr] == poolIndex, "Addr is not authorized for the signer's pool");
    poolOfAuthorizedAddr[addr] = 0;

    emit PoolAuthorizedAddrRemoved(poolIndex, addr);
  }

  /// @notice Lock funds to match a swap request. This is step 2️⃣ in a swap.
  /// The authorized address of the bonding pool should call this method with
  /// the same signature given by `postSwap`. This method will lock swapping fund 
  /// on the target chain for `LOCK_TIME_PERIOD` and wait for fund release and 
  /// execution.
  /// @dev Designed to be used by authorized addresses or pool owners
  /// @param encodedSwap Encoded swap information
  /// @param r Part of the signature (the one given by `postSwap` call)
  /// @param s Part of the signature (the one given by `postSwap` call)
  /// @param v Part of the signature (the one given by `postSwap` call)
  /// @param initiator The swap initiator who created and signed the swap request
  function lock(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address initiator
  ) external matchProtocolVersion(encodedSwap) forTargetChain(encodedSwap) {
    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    require(_lockedSwaps[swapId] == 0, "Swap already exists");
    _checkRequestSignature(encodedSwap, r, s, v, initiator);

    uint40 poolIndex = poolOfAuthorizedAddr[_msgSender()];
    require(poolIndex != 0, "Caller not registered. Call depositAndRegister.");

    uint256 until = block.timestamp + LOCK_TIME_PERIOD;
    require(until < _expireTsFrom(encodedSwap) - 5 minutes, "Cannot lock because expireTs is soon.");

    uint48 poolTokenIndex = _poolTokenIndexForOutToken(encodedSwap, poolIndex);
    // Only (amount - lp fee) is locked from the LP pool. The service fee will be charged on release
    _balanceOfPoolToken[poolTokenIndex] -= (_amountFrom(encodedSwap) - _feeForLp(encodedSwap));
    
    _lockedSwaps[swapId] = _lockedSwapFrom(until, poolIndex);

    emit SwapLocked(encodedSwap);
  }

  /// @notice If the locked swap is not released after `LOCK_TIME_PERIOD`,
  /// the authorized address can call this method to unlock the swapping fund.
  /// @dev Designed to be used by authorized addresses or pool owners
  /// @param encodedSwap Encoded swap information
  /// @param initiator The swap initiator who created and signed the swap request
  function unlock(uint256 encodedSwap, address initiator) external {
    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    uint80 lockedSwap = _lockedSwaps[swapId];
    require(lockedSwap != 0, "Swap does not exist");
    require(_untilFromLocked(lockedSwap) < block.timestamp, "Swap still in lock");

    uint48 poolTokenIndex = _poolTokenIndexForOutToken(encodedSwap, _poolIndexFromLocked(lockedSwap));
    // (amount - lp fee) will be returned because only that amount was locked
    _balanceOfPoolToken[poolTokenIndex] += (_amountFrom(encodedSwap) - _feeForLp(encodedSwap));
    _lockedSwaps[swapId] = 0;

    emit SwapUnlocked(encodedSwap);
  }

  /// @notice Release tokens to satisfy a locked swap. This is step 3️⃣ in a swap.
  /// This method requires a release signature from the swap initiator,
  /// but anyone (initiator herself, the LP, and other people) with the signature 
  /// can call this method to make sure the swapping fund is guaranteed to be released.
  /// @dev Designed to be used by anyone
  /// @param encodedSwap Encoded swap information
  /// @param r Part of the release signature (same as in the `executeSwap` call)
  /// @param s Part of the release signature (same as in the `executeSwap` call)
  /// @param v Part of the release signature (same as in the `executeSwap` call)
  /// @param initiator The swap initiator who created and signed the swap request
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
      // For swaps that service fee is waived, need the premium manager as the signer
      _onlyPremiumManager();
    }
    // For swaps that charge service fee, anyone can call

    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    uint80 lockedSwap = _lockedSwaps[swapId];
    require(lockedSwap != 0, "Swap does not exist");
    require(recipient != address(0), "Recipient cannot be zero address");
    require(_expireTsFrom(encodedSwap) > block.timestamp, "Cannot release because expired");

    _checkReleaseSignature(encodedSwap, recipient, r, s, v, initiator);
    _lockedSwaps[swapId] = 0;

    uint8 tokenIndex = _outTokenIndexFrom(encodedSwap);
    
    // LP fee will be subtracted from the swap amount
    uint256 releaseAmount = _amountFrom(encodedSwap) - _feeForLp(encodedSwap);
    if (!feeWaived) { // If the swap should pay service fee (charged by Meson protocol)
      uint256 serviceFee = _serviceFee(encodedSwap);
      // Subtract service fee from the release amount
      releaseAmount -= serviceFee;
      // Collected service fee will be stored in `_balanceOfPoolToken` with `poolIndex = 0`.
      // Currently, no one is capable to withdraw fund from pool 0. In the future, Meson protocol
      // will specify the purpose of service fee and its usage permission, and upgrade the contract
      // accordingly.
      _balanceOfPoolToken[_poolTokenIndexForOutToken(encodedSwap, 0)] += serviceFee;
    }

    _release(encodedSwap, tokenIndex, initiator, recipient, releaseAmount);

    emit SwapReleased(encodedSwap);
  }

  function _release(uint256 encodedSwap, uint8 tokenIndex, address initiator, address recipient, uint256 amount) private {
    if (_willTransferToContract(encodedSwap)) {
      _transferToContract(tokenForIndex[tokenIndex], recipient, initiator, amount, tokenIndex, _saltDataFrom(encodedSwap));
    } else {
      _safeTransfer(tokenForIndex[tokenIndex], recipient, amount, tokenIndex);
    }
  }

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

  function _onlyPremiumManager() internal view virtual {}
}
