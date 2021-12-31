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
  function deposit(address token, uint256 amount)
    public
    override
    tokenSupported(token)
  {
    address provider = _msgSender();
    balanceOf[token][provider] = LowGasSafeMath.add(
      balanceOf[token][provider],
      amount
    );
    _increaseSupply(token, amount);
    _unsafeDepositToken(token, provider, amount);
  }

  /// @inheritdoc IMesonPools
  function withdraw(
    address token,
    uint256 amount
  ) public override tokenSupported(token) {
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

    balanceOf[token][provider] = LowGasSafeMath.sub(
      balanceOf[token][provider],
      amount
    );
    _safeTransfer(token, receiver, amount);
  }

  /// @inheritdoc IMesonPools
  function lock(
    bytes32 swapId,
    address token,
    uint256 amount,
    address recipient
  ) public override tokenSupported(token) {
    address provider = _msgSender();
    require(amount > 0, "amount must be greater than zero");
    require(balanceOf[token][provider] > amount, "insufficient balance");

    balanceOf[token][provider] = balanceOf[token][provider] - amount;
    uint256 ts = block.timestamp;
    lockingSwaps[swapId] = LockingSwap(
      provider,
      provider,
      token,
      amount,
      recipient,
      ts + 1200
    );

    emit SwapLocked(swapId, provider);
  }

  /// @inheritdoc IMesonPools
  function unlock(bytes32 swapId) public override {
    uint256 ts = block.timestamp;
    uint256 until = lockingSwaps[swapId].until;
    address token = lockingSwaps[swapId].token;
    address provider = lockingSwaps[swapId].provider;
    require(until > 0, "swap not found");
    require(ts > until, "The swap is lockied");

    balanceOf[token][provider] = LowGasSafeMath.add(
      balanceOf[token][provider],
      lockingSwaps[swapId].amount
    );
    delete lockingSwaps[swapId];
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
    require(lockingSwap.amount > 0, "no locking swap found for the swapId");
    require(metaAmount < lockingSwap.amount, "release amount cannot be greater than locking amount");

    _checkReleaseSignature(swapId, lockingSwap.initiator, r, s, v);

    address token = lockingSwap.token;
    address provider = lockingSwap.provider;
    address recipient = lockingSwap.recipient;

    uint256 amount = _fromMetaAmount(token, metaAmount);
    _updateDemand(token, metaAmount);
    _decreaseSupply(token, amount);

    balanceOf[token][provider] = LowGasSafeMath.add(
      balanceOf[token][provider],
      LowGasSafeMath.sub(lockingSwap.amount, amount)
    );

    delete lockingSwaps[swapId];

    _safeTransfer(token, recipient, amount);

    emit SwapReleased(swapId);
  }

  /// @inheritdoc IMesonPools
  function challenge(
    address provider,
    bytes memory signature,
    uint256 metaAmount,
    bytes memory inToken,
    address outToken,
    address receiver,
    uint256 ts
  ) public override {
    // bytes32 swapId =
    //   _isSignatureValid(
    //     provider,
    //     signature,
    //     metaAmount,
    //     inToken,
    //     outToken,
    //     receiver,
    //     ts,
    //     epoch
    //   );
  }
}
