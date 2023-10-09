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
  function depositAndRegister(uint256 amount, uint48 poolTokenIndex) payable external {
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
    _unsafeDepositToken(tokenIndex, poolOwner, amount);

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
  function deposit(uint256 amount, uint48 poolTokenIndex) payable external {
    require(amount > 0, "Amount must be positive");

    uint40 poolIndex = _poolIndexFrom(poolTokenIndex);
    require(poolIndex != 0, "Cannot use 0 as pool index"); // pool 0 is reserved for meson service fee
    require(poolIndex == poolOfAuthorizedAddr[_msgSender()], "Need an authorized address as the signer");
    _balanceOfPoolToken[poolTokenIndex] += amount;
    uint8 tokenIndex = _tokenIndexFrom(poolTokenIndex);
    _unsafeDepositToken(tokenIndex, _msgSender(), amount);

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
    _safeTransfer(tokenIndex, _msgSender(), amount);

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
    delete poolOfAuthorizedAddr[addr];

    emit PoolAuthorizedAddrRemoved(poolIndex, addr);
  }

  /// @notice Transfer the ownership of a pool to another address
  /// @dev Designed to be used by LPs (pool owners)
  /// @param addr The new address to be the pool owner
  function transferPoolOwner(address addr) external {
    address poolOwner = _msgSender();
    uint40 poolIndex = poolOfAuthorizedAddr[poolOwner];
    require(poolIndex != 0, "The signer does not register a pool");
    require(poolOwner == ownerOfPool[poolIndex], "Need the pool owner as the signer");
    require(poolOfAuthorizedAddr[addr] == poolIndex, "Addr is not authorized for the signer's pool");
    ownerOfPool[poolIndex] = addr;

    emit PoolOwnerTransferred(poolIndex, poolOwner, addr);
  }

  function lock(uint256 encodedSwap, bytes32 r, bytes32 yParityAndS, address initiator) external {
    // deprecated
    lockSwap(encodedSwap, initiator);
  }

  /// @notice Lock funds to match a swap request. This is step 2️⃣ in a swap.
  /// The authorized address of the bonding pool should call this method,
  /// which will lock swapping fund on the target chain for `LOCK_TIME_PERIOD`
  /// and wait for fund release and execution.
  /// @dev Designed to be used by authorized addresses or pool owners
  /// @param encodedSwap Encoded swap information
  /// @param initiator The swap initiator who created and signed the swap request
  function lockSwap(uint256 encodedSwap, address initiator)
    public matchProtocolVersion(encodedSwap) forTargetChain(encodedSwap)
  {
    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    require(_lockedSwaps[swapId] == 0, "Swap already exists");

    uint40 poolIndex = poolOfAuthorizedAddr[_msgSender()];
    require(poolIndex != 0, "Caller not registered. Call depositAndRegister.");

    uint256 until = block.timestamp + LOCK_TIME_PERIOD;
    require(until < _expireTsFrom(encodedSwap) - 5 minutes, "Cannot lock because expireTs is soon.");

    uint48 poolTokenIndex = _poolTokenIndexForOutToken(encodedSwap, poolIndex);
    _balanceOfPoolToken[poolTokenIndex] -= _amountToLock(encodedSwap); // The service fee will be charged on release

    uint256 coreAmount = _coreTokenAmount(encodedSwap);
    if (coreAmount > 0) {
      _balanceOfPoolToken[_poolTokenIndexFrom(255, poolIndex)] -= coreAmount;
    }

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
    require(lockedSwap > 1, "Swap does not exist");
    require(_untilFromLocked(lockedSwap) < block.timestamp, "Swap still in lock");

    uint40 poolIndex = _poolIndexFromLocked(lockedSwap);
    uint48 poolTokenIndex = _poolTokenIndexForOutToken(encodedSwap, poolIndex);
    _balanceOfPoolToken[poolTokenIndex] += _amountToLock(encodedSwap);

    uint256 coreAmount = _coreTokenAmount(encodedSwap);
    if (coreAmount > 0) {
      _balanceOfPoolToken[_poolTokenIndexFrom(255, poolIndex)] += coreAmount;
    }

    delete _lockedSwaps[swapId];

    emit SwapUnlocked(encodedSwap);
  }

  /// @notice Release tokens to satisfy a locked swap. This is step 3️⃣ in a swap.
  /// This method requires a release signature from the swap initiator,
  /// but anyone (initiator herself, the LP, and other people) with the signature 
  /// can call this method to make sure the swapping fund is guaranteed to be released.
  /// @dev Designed to be used by anyone
  /// @param encodedSwap Encoded swap information
  /// @param r Part of the release signature (same as in the `executeSwap` call)
  /// @param yParityAndS Part of the release signature (same as in the `executeSwap` call)
  /// @param initiator The swap initiator who created and signed the swap request
  /// @param recipient The recipient address of the swap
  function release(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 yParityAndS,
    address initiator,
    address recipient
  ) external {
    require(_msgSender() == tx.origin, "Cannot be called through contracts");
    require(_expireTsFrom(encodedSwap) > block.timestamp, "Cannot release because expired");
    require(recipient != address(0), "Recipient cannot be zero address");

    bool feeWaived = _feeWaived(encodedSwap);
    if (feeWaived) {
      // For swaps that service fee is waived, need the premium manager as the signer
      require(_isPremiumManager(), "Caller is not the premium manager");
    }
    // For swaps that charge service fee, anyone can call

    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    require(_lockedSwaps[swapId] > 1, "Swap does not exist");

    _checkReleaseSignature(encodedSwap, recipient, r, yParityAndS, initiator);
    _lockedSwaps[swapId] = 1;

    // LP fee will be subtracted from the swap amount
    uint256 releaseAmount = _amountToLock(encodedSwap);
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

    uint256 coreAmount = _coreTokenAmount(encodedSwap);
    if (coreAmount > 0) {
      _safeTransfer(255, recipient, coreAmount);
    }
    _release(encodedSwap, _outTokenIndexFrom(encodedSwap), initiator, recipient, releaseAmount);

    emit SwapReleased(encodedSwap);
  }

  function directRelease(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 yParityAndS,
    address initiator,
    address recipient
  ) external matchProtocolVersion(encodedSwap) forTargetChain(encodedSwap) {
    require(_msgSender() == tx.origin, "Cannot be called through contracts");
    require(_expireTsFrom(encodedSwap) > block.timestamp, "Cannot release because expired");
    require(recipient != address(0), "Recipient cannot be zero address");

    bool feeWaived = _feeWaived(encodedSwap);
    if (feeWaived) {
      require(_isPremiumManager(), "Caller is not the premium manager");
    }

    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    require(_lockedSwaps[swapId] == 0, "Swap already exists");

    uint40 poolIndex = poolOfAuthorizedAddr[_msgSender()];
    require(poolIndex != 0, "Caller not registered. Call depositAndRegister.");

    _checkReleaseSignature(encodedSwap, recipient, r, yParityAndS, initiator);
    _lockedSwaps[swapId] = 1;

    uint256 releaseAmount = _amountToLock(encodedSwap);
    _balanceOfPoolToken[_poolTokenIndexForOutToken(encodedSwap, poolIndex)] -= releaseAmount;

    if (!feeWaived) {
      uint256 serviceFee = _serviceFee(encodedSwap);
      releaseAmount -= serviceFee;
      _balanceOfPoolToken[_poolTokenIndexForOutToken(encodedSwap, 0)] += serviceFee;
    }

    uint256 coreAmount = _coreTokenAmount(encodedSwap);
    if (coreAmount > 0) {
      _balanceOfPoolToken[_poolTokenIndexFrom(255, poolIndex)] -= coreAmount;
      _safeTransfer(255, recipient, coreAmount);
    }
    _release(encodedSwap, _outTokenIndexFrom(encodedSwap), initiator, recipient, releaseAmount);

    emit SwapReleased(encodedSwap);
  }

  function _release(uint256 encodedSwap, uint8 tokenIndex, address initiator, address recipient, uint256 amount) internal {
    if (_willTransferToContract(encodedSwap)) {
      _transferToContract(tokenIndex, recipient, initiator, amount, _saltDataFrom(encodedSwap));
    } else {
      _safeTransfer(tokenIndex, recipient, amount);
      if ((SHORT_COIN_TYPE == 0x9296 || SHORT_COIN_TYPE == 0xb4b1) && _swapForCoreToken(encodedSwap)) {
        _callSkaleFaucet(recipient);
      }
    }
  }

  function _callSkaleFaucet(address recipient) private {
    if (SHORT_COIN_TYPE == 0x9296) {
      // SKALE Europa
      bytes memory data = abi.encodeWithSelector(bytes4(0x6a627842), recipient);
      (bool success, ) = address(0x2B267A3e49b351DEdac892400a530ABb2f899d23).call(data);
      require(success, "Call faucet not successful");
    } else if (SHORT_COIN_TYPE == 0xb4b1) {
      // SKALE Nebula
      bytes memory data = abi.encodeWithSelector(bytes4(0x0c11dedd), recipient);
      (bool success, ) = address(0x5a6869ef5b81DCb58EBF51b8F893c31f5AFE3Fa8).call(data);
      require(success, "Call faucet not successful");
    } 
  }

  function simpleRelease(uint256 encodedSwap, address recipient)
    external matchProtocolVersion(encodedSwap) forTargetChain(encodedSwap)
  {
    require(_isPremiumManager(), "Caller is not the premium manager");
    require(recipient != address(0), "Recipient cannot be zero address");

    uint256 releaseAmount = _amountToLock(encodedSwap);
    _balanceOfPoolToken[_poolTokenIndexForOutToken(encodedSwap, 1)] -= releaseAmount;

    bool feeWaived = _feeWaived(encodedSwap);
    if (!feeWaived) {
      uint256 serviceFee = _serviceFee(encodedSwap);
      releaseAmount -= serviceFee;
      _balanceOfPoolToken[_poolTokenIndexForOutToken(encodedSwap, 0)] += serviceFee;
    }

    uint256 coreAmount = _coreTokenAmount(encodedSwap);
    if (coreAmount > 0) {
      _balanceOfPoolToken[_poolTokenIndexFrom(255, 1)] -= coreAmount;
      _safeTransfer(255, recipient, coreAmount);
    }
    _safeTransfer(_outTokenIndexFrom(encodedSwap), recipient, releaseAmount);

    emit SwapReleased(encodedSwap);
  }

  /// @notice Read information for a locked swap
  function getLockedSwap(uint256 encodedSwap, address initiator) external view
    returns (address poolOwner, uint40 until)
  {
    bytes32 swapId = _getSwapId(encodedSwap, initiator);
    uint80 lockedSwap = _lockedSwaps[swapId];
    if (lockedSwap == 1) {
      poolOwner = address(1);
      until = 0;
    } else {
      poolOwner = ownerOfPool[_poolIndexFromLocked(lockedSwap)];
      until = uint40(_untilFromLocked(lockedSwap));
    }
  }

  modifier forTargetChain(uint256 encodedSwap) {
    require(_outChainFrom(encodedSwap) == SHORT_COIN_TYPE, "Swap not for this chain");
    require(_outTokenIndexFrom(encodedSwap) < 255 || IS_CORE_ETH, "Swap for core token not available");
    _;
  }

  function _isPremiumManager() internal view virtual returns (bool) {}
}
