// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../libraries/LowGasSafeMath.sol";

import "./IMesonPools.sol";
import "../utils/MesonPricing.sol";

/// @title MesonPools
/// @notice The class to manage liquidity pools for providers.
/// Methods in this class will be executed by LPs when users want to
/// swap into the current chain.
contract MesonPools is Context, IMesonPools, MesonPricing {
  mapping(address => mapping(address => uint256)) public balanceOf;

  mapping(bytes32 => LockingSwap) public lockingSwaps;

  /// @inheritdoc IMesonPools
  function deposit(address token, uint256 amount) public override tokenSupported(token) {
    address provider = _msgSender();
    balanceOf[token][provider] = LowGasSafeMath.add(balanceOf[token][provider], amount);
    _increaseSupply(token, amount);
    _unsafeDepositToken(token, provider, amount);
  }

  /// @inheritdoc IMesonPools
  function withdraw(address token, uint256 amount) public override tokenSupported(token) {
    address provider = _msgSender(); // this may not be the correct msg.sender
    _decreaseSupply(token, amount);
    _withdrawTo(provider, provider, token, amount);
  }

  /// @notice Perform the withdraw operations and update internal states
  function _withdrawTo(
    address receiver,
    address provider,
    address token,
    uint256 amount
  ) private {
    require(balanceOf[token][provider] >= amount, "overdrawn");

    balanceOf[token][provider] = LowGasSafeMath.sub(balanceOf[token][provider], amount);
    _safeTransfer(token, receiver, amount);
  }

  /// @inheritdoc IMesonPools
  function lock(
    bytes32 swapId,
    address initiator,
    uint256 amount,
    address token,
    address recipient
  ) public override tokenSupported(token) {
    require(amount > 0, "amount must be greater than zero");
    require(!_hasLockingSwap(swapId), "locking swap already exists");
    address provider = _msgSender();
    require(balanceOf[token][provider] >= amount, "insufficient balance");

    balanceOf[token][provider] = balanceOf[token][provider] - amount;
    lockingSwaps[swapId] = LockingSwap(
      initiator,
      provider,
      token,
      amount,
      recipient,
      block.timestamp + LOCK_TIME_PERIOD
    );

    emit SwapLocked(swapId, provider);
  }

  /// @inheritdoc IMesonPools
  function unlock(bytes32 swapId) public override {
    require(_hasLockingSwap(swapId), "swap does not exist");

    LockingSwap memory lockingSwap = lockingSwaps[swapId];
    require(block.timestamp > lockingSwap.until, "The swap is still in lock");

    address token = lockingSwap.token;
    uint256 amount = lockingSwap.amount;
    address provider = lockingSwap.provider;

    balanceOf[token][provider] = LowGasSafeMath.add(balanceOf[token][provider], amount);
    delete lockingSwaps[swapId];

    emit SwapUnlocked(swapId);
  }

  /// @inheritdoc IMesonPools
  function release(
    bytes32 swapId,
    uint256 metaAmount,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) public override {
    LockingSwap memory lockingSwap = lockingSwaps[swapId];
    require(_hasLockingSwap(swapId), "swap does not exist");
    require(
      metaAmount <= lockingSwap.amount,
      "release amount cannot be greater than locking amount"
    );

    _checkReleaseSignature(swapId, lockingSwap.initiator, r, s, v);

    address token = lockingSwap.token;
    address provider = lockingSwap.provider;
    address recipient = lockingSwap.recipient;

    // uint256 amount = _fromMetaAmount(token, metaAmount);
    // _updateDemand(token, metaAmount);
    // _decreaseSupply(token, amount);

    if (metaAmount < lockingSwap.amount) {
      balanceOf[token][provider] = LowGasSafeMath.add(
        balanceOf[token][provider],
        LowGasSafeMath.sub(lockingSwap.amount, metaAmount)
      );
    }

    delete lockingSwaps[swapId];

    _safeTransfer(token, recipient, metaAmount);

    emit SwapReleased(swapId, inChain, r, s, v);
  }

  /// @inheritdoc IMesonPools
  function challenge() public override {
  }

  function _hasLockingSwap(bytes32 swapId) internal view returns (bool) {
    return lockingSwaps[swapId].amount > 0;
  }
}
