// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../libraries/LowGasSafeMath.sol";
import "../interfaces/IERC20Minimal.sol";

import "./IMesonSwap.sol";
import "../utils/MesonStates.sol";

/// @title MesonSwap
/// @notice The class to receive and process swap requests.
/// Methods in this class will be executed by users or LPs when
/// users initiate swaps in the current chain.
contract MesonSwap is Context, IMesonSwap, MesonStates {
  /// @notice swap requests by swapIds
  mapping(bytes32 => SwapRequest) public requests;

  /// @inheritdoc IMesonSwap
  function requestSwap(bytes memory encodedSwap, address inToken)
    external
    override
    tokenSupported(inToken)
    returns (bytes32)
  {
    (bytes32 swapId, uint128 amount, uint48 fee, uint48 expireTs) = _verifyEncodedSwap(encodedSwap, inToken);

    address initiator = _msgSender();

    uint128 total = LowGasSafeMath.add(amount, fee); // TODO: fee to meson protocol
    requests[swapId] = SwapRequest(initiator, address(0), inToken, total, expireTs);

    _unsafeDepositToken(inToken, initiator, total);

    emit SwapRequested(swapId);
    return swapId;
  }

  function bondSwap(bytes32 swapId) public override swapExists(swapId) {
    require(requests[swapId].provider == address(0), "swap bonded to another provider");
    requests[swapId].provider = _msgSender();

    emit SwapBonded(swapId);
  }

  /// @inheritdoc IMesonSwap
  function postSwap(
    bytes memory encodedSwap,
    address inToken,
    address initiator,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) external override tokenSupported(inToken) returns (bytes32) {
    (bytes32 swapId, uint128 amount, uint48 fee, uint48 expireTs) = _verifyEncodedSwap(encodedSwap, inToken);

    require(initiator == ecrecover(swapId, v, r, s), "invalid signature");

    address provider = _msgSender();
    uint128 total = LowGasSafeMath.add(amount, fee); // TODO: fee to meson protocol
    requests[swapId] = SwapRequest(initiator, provider, inToken, total, expireTs);

    _unsafeDepositToken(inToken, initiator, total);

    emit SwapPosted(swapId);
    return swapId;
  }

  function _verifyEncodedSwap(bytes memory encodedSwap, address inToken)
    private
    view
    returns (bytes32, uint128, uint48, uint48)
  {
    (bytes32 inTokenHash, uint128 amount, uint48 fee, uint48 expireTs) = _decodeSwapInput(encodedSwap);

    require(keccak256(abi.encodePacked(inToken)) == inTokenHash, "inToken does not match");
    require(amount > 0, "swap amount must be greater than zero");

    uint64 ts = uint64(block.timestamp);
    require(expireTs > ts + MIN_BOND_TIME_PERIOD, "expires ts too early");
    require(expireTs < ts + MAX_BOND_TIME_PERIOD, "expires ts too late");

    bytes32 swapId = _getSwapId(encodedSwap);
    require(!_hasSwap(swapId), "swap conflict"); // TODO: prevent duplication attack

    return (swapId, amount, fee, expireTs);
  }

  /// @inheritdoc IMesonSwap
  function cancelSwap(bytes32 swapId) external override swapExists(swapId) swapExpired(swapId) {
    SwapRequest memory req = requests[swapId];
    address inToken = req.inToken;
    address initiator = req.initiator;
    uint128 total = req.total;
    delete requests[swapId];

    _safeTransfer(inToken, initiator, total);

    emit SwapCancelled(swapId);
  }

  /// @inheritdoc IMesonSwap
  function executeSwap(
    bytes32 swapId,
    bytes memory recipient,
    bytes32 r,
    bytes32 s,
    uint8 v,
    bool depositToPool
  ) external override swapExists(swapId) {
    SwapRequest memory req = requests[swapId];
    _checkReleaseSignature(swapId, keccak256(recipient), DOMAIN_SEPARATOR, req.initiator, r, s, v);

    address inToken = req.inToken;
    address provider = req.provider;
    uint128 total = req.total;

    delete requests[swapId];

    if (depositToPool) {
      balanceOf[inToken][provider] = LowGasSafeMath.add(balanceOf[inToken][provider], total);
    } else {
      _safeTransfer(inToken, provider, total);
    }

    emit SwapExecuted(swapId);
  }

  function _deleteRequest(bytes32 swapId) internal {
    delete requests[swapId];
  }

  /// @dev Check the swap for the given swapId exsits
  modifier swapExists(bytes32 swapId) {
    require(_hasSwap(swapId), "swap not found");
    _;
  }

  /// @dev Check the swap is bonded
  modifier swapExpired(bytes32 swapId) {
    require(requests[swapId].expireTs < uint64(block.timestamp), "swap not expired");
    _;
  }

  function _hasSwap(bytes32 swapId) internal view returns (bool) {
    return requests[swapId].total > 0;
  }
}
