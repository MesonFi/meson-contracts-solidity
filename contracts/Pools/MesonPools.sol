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
    balanceOf[token][providerIndex] = LowGasSafeMath.add(balanceOf[token][providerIndex], amount);
    _unsafeDepositToken(token, provider, amount);
  }

  /// @inheritdoc IMesonPools
  function withdraw(address token, uint128 amount) external override tokenSupported(token) {
    address provider = _msgSender(); // this may not be the correct msg.sender
    uint32 providerIndex = indexOfAddress[provider];
    require(balanceOf[token][providerIndex] >= amount, "overdrawn");
    balanceOf[token][providerIndex] = LowGasSafeMath.sub(balanceOf[token][providerIndex], amount);

    _safeTransfer(token, provider, amount);
  }

  /// @inheritdoc IMesonPools
  function lock(
    bytes32 swapId,
    address initiator,
    uint128 amount,
    address token
  ) external override tokenSupported(token) {
    require(amount > 0, "amount must be greater than zero");
    require(!_hasLockingSwap(swapId), "locking swap already exists");
    address provider = _msgSender();
    uint32 providerIndex = indexOfAddress[provider];
    require(balanceOf[token][providerIndex] >= amount, "insufficient balance");

    balanceOf[token][providerIndex] = balanceOf[token][providerIndex] - amount;
    lockingSwaps[swapId] = LockingSwap(
      initiator,
      provider,
      token,
      amount,
      uint64(block.timestamp) + LOCK_TIME_PERIOD
    );

    emit SwapLocked(swapId, provider);
  }

  /// @inheritdoc IMesonPools
  function unlock(bytes32 swapId) external override {
    require(_hasLockingSwap(swapId), "swap does not exist");

    LockingSwap memory lockingSwap = lockingSwaps[swapId];
    require(uint64(block.timestamp) > lockingSwap.until, "The swap is still in lock");

    address token = lockingSwap.token;
    uint128 amount = lockingSwap.amount;
    address provider = lockingSwap.provider;
    uint32 providerIndex = indexOfAddress[provider];

    balanceOf[token][providerIndex] = LowGasSafeMath.add(balanceOf[token][providerIndex], amount);
    delete lockingSwaps[swapId];
  }

  /// @inheritdoc IMesonPools
  function release(
    bytes32 swapId,
    address recipient,
    uint128 metaAmount,
    bytes32 domainHash, // TODO: need to give allowed values?
    bytes32 r,
    bytes32 s,
    uint8 v
  ) external override {
    LockingSwap memory lockingSwap = lockingSwaps[swapId];
    require(_hasLockingSwap(swapId), "swap does not exist");
    require(
      metaAmount <= lockingSwap.amount,
      "release amount cannot be greater than locking amount"
    );

    _checkReleaseSignature(swapId, keccak256(abi.encodePacked(recipient)), domainHash, lockingSwap.initiator, r, s, v);

    address token = lockingSwap.token;
    address provider = lockingSwap.provider;
    uint32 providerIndex = indexOfAddress[provider];

    if (metaAmount < lockingSwap.amount) {
      balanceOf[token][providerIndex] = LowGasSafeMath.add(
        balanceOf[token][providerIndex],
        LowGasSafeMath.sub(lockingSwap.amount, metaAmount)
      );
    }

    delete lockingSwaps[swapId];

    _safeTransfer(token, recipient, metaAmount);

    emit SwapReleased(swapId);
  }

  /// @inheritdoc IMesonPools
  function challenge() external override {
  }

  function _hasLockingSwap(bytes32 swapId) internal view returns (bool) {
    return lockingSwaps[swapId].amount > 0;
  }
}
