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
  function requestSwap(bytes memory encodedSwap, uint8 inTokenIndex)
    external
    override
    returns (bytes32)
  {
    // address inToken = tokens[inTokenIndex];
    // (bytes32 swapId, uint128 amount, uint48 fee, uint48 expireTs) = _verifyEncodedSwap(encodedSwap, inToken);

    // address initiator = _msgSender();

    // uint128 total = LowGasSafeMath.add(amount, fee); // TODO: fee to meson protocol
    // requests[swapId] = SwapRequest(initiator, 0, inTokenIndex, total, expireTs);

    // _unsafeDepositToken(inToken, initiator, total);

    // emit SwapRequested(swapId);
    // return swapId;
  }

  function bondSwap(bytes32 swapId) public override {
    // require(requests[swapId].providerIndex == 0, "swap bonded to another provider");
    // requests[swapId].providerIndex = indexOfAddress[_msgSender()];

    // emit SwapBonded(swapId);
  }

  /// @inheritdoc IMesonSwap
  function postSwap(
    bytes calldata encodedSwap,
    address initiator,
    bytes32 r,
    bytes32 s,
    uint8 v,
    uint32 providerIndex
  ) external override {
    bytes32 swapId = _getSwapId(encodedSwap);
    require(_swapRequests[swapId].initiator == address(0), "swap conflict");
    require(initiator == ecrecover(swapId, v, r, s), "invalid signature");

     // TODO: user may make more requests
    (bytes32 inTokenHash, uint128 amountWithFee, uint48 expireTs) = _decodeSwapInput(encodedSwap);
    address inToken = _tokenAddressByHash[inTokenHash];
    require(inToken != address(0), "token unsupported");
    require(amountWithFee > 0, "swap amount must be greater than zero");

    uint48 ts = uint48(block.timestamp);
    require(expireTs > ts + MIN_BOND_TIME_PERIOD, "expire ts too early");
    require(expireTs < ts + MAX_BOND_TIME_PERIOD, "expire ts too late");

    _swapRequests[swapId] = SwapRequest(initiator, providerIndex);

    _unsafeDepositToken(inToken, initiator, amountWithFee);

    emit SwapPosted(swapId);
  }

  /// @inheritdoc IMesonSwap
  function cancelSwap(bytes32 swapId) external override {
    // (uint128 total,, uint48 expireTs, uint8 inTokenIndex) = _unpackSwapData(swapData[swapId]);
    // address inToken = tokens[inTokenIndex];
    // address initiator = swapInitiator[swapId];

    // // check expireTs

    // delete swapInitiator[swapId];
    // // delete swapData[swapId];

    // _safeTransfer(inToken, initiator, total);

    // emit SwapCancelled(swapId);
  }

  /// @inheritdoc IMesonSwap
  function executeSwap(
    bytes calldata encodedSwap,
    bytes32 swapId,
    bytes memory recipient,
    bytes32 r,
    bytes32 s,
    uint8 v,
    bool depositToPool
  ) external override {
    require(swapId == _getSwapId(encodedSwap), 'swap id does not match');

    address initiator = _swapRequests[swapId].initiator;
    uint32 providerIndex = _swapRequests[swapId].providerIndex;
    require(providerIndex != 0, "swap not found or not bonded");

    _checkReleaseSignature(swapId, keccak256(recipient), DOMAIN_SEPARATOR, initiator, r, s, v);

    (bytes32 inTokenHash, uint128 amountWithFee,) = _decodeSwapInput(encodedSwap);

    // TODO: fee to meson protocol

    delete _swapRequests[swapId];

    if (depositToPool) {
      _tokenBalanceOf[0][providerIndex]
        = LowGasSafeMath.add(_tokenBalanceOf[0][providerIndex], amountWithFee);
    } else {
      address provider = addressOfIndex[providerIndex];
      address inToken = _tokenAddressByHash[inTokenHash];
      _safeTransfer(inToken, provider, amountWithFee);
    }

    emit SwapExecuted(swapId);
  }
}
