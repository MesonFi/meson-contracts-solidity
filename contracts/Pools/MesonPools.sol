// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../libraries/LowGasSafeMath.sol";

import "./IMesonPools.sol";
import "../utils/MesonStates.sol";

/// @title MesonPools
/// @notice The class to manage liquidity pools for providers.
/// Methods in this class will be executed by LPs when users want to
/// swap into the current chain.
contract MesonPools is IMesonPools, MesonStates {
  mapping(bytes32 => LockingSwap) public lockingSwaps;

  /// @inheritdoc IMesonPools
  function deposit(address token, uint128 amount) external override tokenSupported(token) {
    address provider = _msgSender();
    uint32 providerIndex = indexOfAddress[provider];
    bytes32 tokenHash = _tokenHashByAddress[token];
    _tokenBalanceOf[tokenHash][providerIndex] = LowGasSafeMath.add(
      _tokenBalanceOf[tokenHash][providerIndex], amount
    );
    _unsafeDepositToken(token, provider, amount);
  }

  /// @inheritdoc IMesonPools
  function withdraw(address token, uint128 amount) external override tokenSupported(token) {
    address provider = _msgSender();
    uint32 providerIndex = indexOfAddress[provider];
    bytes32 tokenHash = _tokenHashByAddress[token];
    _tokenBalanceOf[tokenHash][providerIndex] = LowGasSafeMath.sub(
      _tokenBalanceOf[tokenHash][providerIndex], amount
    );
    _safeTransfer(token, provider, amount);
  }

  /// @inheritdoc IMesonPools
  function lock(
    bytes32 swapId,
    address initiator,
    uint128 amount,
    bytes32 tokenHash
  ) external override {
    // tokenSupported(token)
    require(amount > 0, "amount must be greater than zero");
    require(!_hasLockingSwap(swapId), "locking swap already exists");
    uint32 providerIndex = indexOfAddress[_msgSender()];
    require(_tokenBalanceOf[tokenHash][providerIndex] >= amount, "insufficient balance");

    _tokenBalanceOf[tokenHash][providerIndex] = _tokenBalanceOf[tokenHash][providerIndex] - amount;
    lockingSwaps[swapId] = LockingSwap(
      initiator,
      tokenHash,
      amount,
      providerIndex,
      uint48(block.timestamp) + LOCK_TIME_PERIOD
    );

    emit SwapLocked(swapId);
  }

  /// @inheritdoc IMesonPools
  function unlock(bytes32 swapId) external override {
    require(_hasLockingSwap(swapId), "swap does not exist");

    LockingSwap memory lockingSwap = lockingSwaps[swapId];
    require(uint48(block.timestamp) > lockingSwap.until, "The swap is still in lock");

    bytes32 tokenHash = lockingSwap.tokenHash;
    uint128 amount = lockingSwap.amount;
    uint32 providerIndex = lockingSwap.providerIndex;

    _tokenBalanceOf[tokenHash][providerIndex] = LowGasSafeMath.add(
      _tokenBalanceOf[tokenHash][providerIndex], amount
    );
    delete lockingSwaps[swapId];
  }

  /// @inheritdoc IMesonPools
  function release(
    bytes32 swapId,
    address recipient,
    bytes32 domainHash, // TODO: need to give allowed values?
    bytes32 r,
    bytes32 s,
    uint8 v
  ) external override {
    LockingSwap memory lockingSwap = lockingSwaps[swapId];
    require(_hasLockingSwap(swapId), "swap does not exist");

    _checkReleaseSignature(swapId, keccak256(abi.encodePacked(recipient)), domainHash, lockingSwap.initiator, r, s, v);

    address token = _tokenAddressByHash[lockingSwap.tokenHash];
    uint128 amount = lockingSwap.amount;
    uint32 providerIndex = lockingSwap.providerIndex;

    delete lockingSwaps[swapId];

    _safeTransfer(token, recipient, amount);

    emit SwapReleased(swapId);
  }

  /// @inheritdoc IMesonPools
  function challenge() external override {
  }

  function _hasLockingSwap(bytes32 swapId) internal view returns (bool) {
    return lockingSwaps[swapId].amount > 0;
  }
}
