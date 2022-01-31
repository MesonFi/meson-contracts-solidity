// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

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
  mapping(bytes32 => uint200) internal _swapRequests;

  /// @inheritdoc IMesonSwap
  function requestSwap(uint256 encodedSwap) external override {
    bytes32 swapId = _getSwapId(encodedSwap, DOMAIN_SEPARATOR);
    require(_swapRequests[swapId] == 0, "swap conflict");

    (uint128 amountWithFee, address inToken) = _checkSwapRequest(encodedSwap);
    address initiator = _msgSender();
    _swapRequests[swapId] = uint200(uint160(initiator)) << 40;
    _unsafeDepositToken(inToken, initiator, amountWithFee);
    emit SwapRequested(swapId);
  }

  function bondSwap(bytes32 swapId, uint40 providerIndex) public override {
    uint200 req = _swapRequests[swapId];
    require(req != 0, "no swap");
    require(uint40(req) == 0, "swap bonded to another provider");

    _swapRequests[swapId] = req | providerIndex;
    emit SwapBonded(swapId);
  }

  /// @inheritdoc IMesonSwap
  function postSwap(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address initiator,
    uint40 providerIndex // TODO register providerIndex on the initial chain
  ) external override {
    bytes32 swapId = _getSwapId(encodedSwap, DOMAIN_SEPARATOR);
    require(_swapRequests[swapId] == 0, "swap conflict");
    require(initiator == ecrecover(swapId, v, r, s), "invalid signature");

    _swapRequests[swapId] = (uint200(uint160(initiator)) << 40) | providerIndex;
    (uint128 amountWithFee, address inToken) = _checkSwapRequest(encodedSwap);

    _unsafeDepositToken(inToken, initiator, amountWithFee);
    emit SwapPosted(swapId);
  }

  function _checkSwapRequest(uint256 encodedSwap) internal view
    returns (uint128, address)
  {
    // TODO: user may make more requests
    uint128 amountWithFee = uint128(encodedSwap >> 128);
    uint40 expireTs = uint40(encodedSwap >> 48);
    uint8 inTokenIndex = uint8(encodedSwap);

    require(inTokenIndex < _tokenList.length, "unsupported token");
    address inToken = _tokenList[inTokenIndex];
    require(amountWithFee > 0, "swap amount must be greater than zero");

    uint40 ts = uint40(block.timestamp);
    require(expireTs > ts + MIN_BOND_TIME_PERIOD, "expire ts too early");
    require(expireTs < ts + MAX_BOND_TIME_PERIOD, "expire ts too late");

    return (amountWithFee, inToken);
  }

  /// @inheritdoc IMesonSwap
  function cancelSwap(uint256 encodedSwap) external override {
    bytes32 swapId = _getSwapId(encodedSwap, DOMAIN_SEPARATOR);
    uint200 req = _swapRequests[swapId];
    require(req != 0, "no swap");

    address initiator = address(uint160(req >> 40));

    uint128 amountWithFee = uint128(encodedSwap >> 128);
    uint40 expireTs = uint40(encodedSwap >> 48);
    uint8 inTokenIndex = uint8(encodedSwap);

    require(expireTs < uint40(block.timestamp), "swap is locked");
    address inToken = _tokenList[inTokenIndex];

    _swapRequests[swapId] = 0;

    _safeTransfer(inToken, initiator, amountWithFee);

    emit SwapCancelled(swapId);
  }

  /// @inheritdoc IMesonSwap
  function executeSwap(
    uint256 encodedSwap,
    bytes32 recipientHash,
    bytes32 r,
    bytes32 s,
    uint8 v,
    bool depositToPool
  ) external override {
    bytes32 domainSeparator = DOMAIN_SEPARATOR;
    bytes32 swapId = _getSwapId(encodedSwap, domainSeparator);

    uint200 req = _swapRequests[swapId];
    uint40 providerIndex = uint40(req);
    require(providerIndex != 0, "swap not found or not bonded");

    address initiator = address(uint160(req >> 40));
    _checkReleaseSignature(swapId, recipientHash, domainSeparator, initiator, r, s, v);

    uint128 amountWithFee = uint128(encodedSwap >> 128);
    uint8 inTokenIndex = uint8(encodedSwap);

    _swapRequests[swapId] = 0;

    // TODO: fee to meson protocol

    if (depositToPool) {
      _tokenBalanceOf[inTokenIndex][providerIndex]
        = LowGasSafeMath.add(_tokenBalanceOf[inTokenIndex][providerIndex], amountWithFee);
    } else {
      address provider = addressOfIndex[providerIndex];
      address inToken = _tokenList[inTokenIndex];
      _safeTransfer(inToken, provider, amountWithFee);
    }

    emit SwapExecuted(swapId);
  }

  function getSwap(bytes32 swapId) external view
    returns (address initiator, address provider)
  {
    uint200 req = _swapRequests[swapId];
    provider = addressOfIndex[uint40(req)];
    initiator = address(uint160(req >> 40));
  }
}
