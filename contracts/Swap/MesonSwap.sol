// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Strings.sol";

import "../libraries/LowGasSafeMath.sol";
import "../interfaces/IERC20Minimal.sol";

import "./IMesonSwap.sol";
import "../utils/MesonStates.sol";

/// @title MesonSwap
/// @notice The class to receive and process swap requests.
/// Methods in this class will be executed by users or LPs when
/// users initiate swaps in the current chain.
contract MesonSwap is IMesonSwap, MesonStates {
  /// @notice swap requests by swapIds
  mapping(bytes32 => SwapRequest) internal _swapRequests;

  /// @inheritdoc IMesonSwap
  function requestSwap(bytes calldata encodedSwap) external override {
    bytes32 swapId = _getSwapId(encodedSwap, DOMAIN_SEPARATOR);
    require(_swapRequests[swapId].initiator == address(0), "swap conflict");

    (address inToken, uint128 amountWithFee) = _checkSwapRequest(encodedSwap);
    address initiator = _msgSender();

    _swapRequests[swapId] = SwapRequest(initiator, 0);
    _unsafeDepositToken(inToken, initiator, amountWithFee);
    emit SwapRequested(swapId);
  }

  function bondSwap(bytes32 swapId, uint40 providerIndex) public override {
    require(_swapRequests[swapId].initiator != address(0), "no swap");
    require(_swapRequests[swapId].providerIndex == 0, "swap bonded to another provider");
    
    _swapRequests[swapId].providerIndex = providerIndex;
    emit SwapBonded(swapId);
  }

  /// @inheritdoc IMesonSwap
  function postSwap(
    bytes calldata encodedSwap,
    address initiator,
    bytes32 r,
    bytes32 s,
    uint8 v,
    uint40 providerIndex
  ) external override {
    bytes32 swapId = _getSwapId(encodedSwap, DOMAIN_SEPARATOR);
    require(_swapRequests[swapId].initiator == address(0), "swap conflict");
    require(initiator == ecrecover(swapId, v, r, s), "invalid signature");

    (address inToken, uint128 amountWithFee) = _checkSwapRequest(encodedSwap);

    _swapRequests[swapId] = SwapRequest(initiator, providerIndex);
    _unsafeDepositToken(inToken, initiator, amountWithFee);
    emit SwapPosted(swapId);
  }

  function _checkSwapRequest(bytes calldata encodedSwap) internal view
    returns (address, uint128)
  {
     // TODO: user may make more requests
    (bytes32 inTokenHash, uint128 amountWithFee, uint48 expireTs) = _decodeSwapInput(encodedSwap);
    address inToken = _tokenAddressByHash[inTokenHash];
    require(inToken != address(0), "unsupported token");
    require(amountWithFee > 0, "swap amount must be greater than zero");

    uint48 ts = uint48(block.timestamp);
    require(expireTs > ts + MIN_BOND_TIME_PERIOD, "expire ts too early");
    require(expireTs < ts + MAX_BOND_TIME_PERIOD, "expire ts too late");

    return (inToken, amountWithFee);
  }

  /// @inheritdoc IMesonSwap
  function cancelSwap(bytes calldata encodedSwap) external override {
    bytes32 swapId = _getSwapId(encodedSwap, DOMAIN_SEPARATOR);
    address initiator = _swapRequests[swapId].initiator;
    require(initiator != address(0), "no swap");

    (bytes32 inTokenHash, uint128 amountWithFee, uint48 expireTs) = _decodeSwapInput(encodedSwap);
    require(expireTs < uint48(block.timestamp), "swap is locked");
    address inToken = _tokenAddressByHash[inTokenHash];

    delete _swapRequests[swapId];

    _safeTransfer(inToken, initiator, amountWithFee);

    emit SwapCancelled(swapId);
  }

  /// @inheritdoc IMesonSwap
  function executeSwap(
    bytes calldata encodedSwap,
    bytes32 recipientHash,
    bytes32 r,
    bytes32 s,
    uint8 v,
    bool depositToPool
  ) external override {
    bytes32 swapId = _getSwapId(encodedSwap, DOMAIN_SEPARATOR);
    address initiator = _swapRequests[swapId].initiator;
    uint40 providerIndex = _swapRequests[swapId].providerIndex;
    require(providerIndex != 0, "swap not found or not bonded");

    _checkReleaseSignature(swapId, recipientHash, DOMAIN_SEPARATOR, initiator, r, s, v);

    (bytes32 inTokenHash, uint128 amountWithFee,) = _decodeSwapInput(encodedSwap);

    delete _swapRequests[swapId];

    // TODO: fee to meson protocol

    if (depositToPool) {
      _tokenBalanceOf[inTokenHash][providerIndex]
        = LowGasSafeMath.add(_tokenBalanceOf[inTokenHash][providerIndex], amountWithFee);
    } else {
      address provider = addressOfIndex[providerIndex];
      address inToken = _tokenAddressByHash[inTokenHash];
      _safeTransfer(inToken, provider, amountWithFee);
    }

    emit SwapExecuted(swapId);
  }

  function getSwap(bytes32 swapId) external view
    returns (address initiator, address provider)
  {
    initiator = _swapRequests[swapId].initiator;
    uint40 providerIndex = _swapRequests[swapId].providerIndex;
    provider = addressOfIndex[providerIndex];
  }
}
