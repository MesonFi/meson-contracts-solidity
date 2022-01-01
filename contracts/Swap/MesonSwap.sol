// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../libraries/LowGasSafeMath.sol";
import "../interfaces/IERC20Minimal.sol";

import "./IMesonSwap.sol";
import "../utils/MesonPricing.sol";

/// @title MesonSwap
/// @notice The class to receive and process swap requests.
/// Methods in this class will be executed by users or LPs when
/// users initiate swaps in the current chain.
contract MesonSwap is Context, IMesonSwap, MesonPricing {
  /// @notice swap requests by swapIds
  mapping(bytes32 => SwapRequest) public requests;

  /// @inheritdoc IMesonSwap
  function postSwap(
    bytes memory encodedSwap,
    address inToken,
    address initiator,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) public override tokenSupported(inToken) returns (bytes32 swapId) {
    (uint256 expireTs, bytes32 inTokenHash, uint256 amount) = _decodeSwapInput(encodedSwap);

    require(keccak256(abi.encodePacked(inToken)) == inTokenHash, "inToken does not match");
    require(amount > 0, "swap amount must be greater than zero");

    uint256 ts = block.timestamp;
    require(expireTs > ts + MIN_BOND_TIME_PERIOD, "expires ts too early");
    require(expireTs < ts + MAX_BOND_TIME_PERIOD, "expires ts too late");

    address provider = _msgSender();

    swapId = keccak256(encodedSwap);
    require(!_hasSwap(swapId), "swap conflict"); // TODO: prevent duplication attack
    require(initiator == _recoverSigner(swapId, r, s, v), "invalid signature");

    // uint256 metaAmount = _toMetaAmount(inToken, amount);

    requests[swapId] = SwapRequest(
      initiator,
      provider,
      expireTs,
      inToken,
      amount
    );

    _unsafeDepositToken(inToken, initiator, amount);

    emit SwapPosted(swapId, ts, amount, inToken);
  }

  /// @inheritdoc IMesonSwap
  function cancelSwap(bytes32 swapId)
    public
    override
    swapExists(swapId)
    swapExpired(swapId)
  {
    address inToken = requests[swapId].inToken;
    address initiator = requests[swapId].initiator;
    uint256 amount = requests[swapId].amount;
    delete requests[swapId];

    _safeTransfer(inToken, initiator, amount);

    emit SwapCancelled(swapId);
  }

  /// @inheritdoc IMesonSwap
  function executeSwap(
    bytes32 swapId,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) public override swapExists(swapId) {
    SwapRequest memory req = requests[swapId];
    _checkReleaseSignature(swapId, req.initiator, r, s, v);

    uint256 amount = req.amount;
    address inToken = req.inToken;
    address provider = req.provider;

    delete requests[swapId];

    _safeTransfer(inToken, provider, amount);

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
    require(requests[swapId].expireTs < block.timestamp, "swap not expired");
    _;
  }

  function _hasSwap(bytes32 swapId) internal view returns (bool) {
    return requests[swapId].amount > 0;
  }
}
