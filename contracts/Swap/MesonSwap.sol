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
contract MesonSwap is Context, MesonPricing, IMesonSwap {
  /// @notice swap requests by swapIds
  mapping(bytes32 => SwapRequest) public requests;

  /// @inheritdoc IMesonSwap
  function requestSwap(
    uint256 amount,
    address inToken,
    bytes4 chain,
    bytes memory outToken,
    bytes memory receiver
  ) public override tokenSupported(inToken) returns (bytes32) {
    // TODO: how to allow contracts to use and make sure it is safe?

    uint256 metaAmount = _toMetaAmount(inToken, amount);
    bytes32 swapId = _getSwapId(metaAmount, inToken, chain, outToken, receiver);
    require(!_swapExists(swapId), "swap conflict");

    address provider = _msgSender();

    _newRequest(swapId, amount, metaAmount, inToken, chain, outToken, receiver);

    IERC20Minimal(inToken).transferFrom(provider, address(this), amount);

    emit RequestPosted(swapId, metaAmount, inToken, chain, outToken, receiver);

    return swapId;
  }

  /// @inheritdoc IMesonSwap
  function bondSwap(bytes32 swapId, address provider)
    public
    override
    swapExists(swapId)
    swapUnbondedOrExpired(swapId)
  {
    require(_msgSender() == provider, "must be signed by provider");
    requests[swapId].provider = provider;
    requests[swapId].bondUntil = LowGasSafeMath.add(
      block.timestamp,
      BOND_TIME_PERIOD
    );

    emit RequestBonded(swapId, provider);
  }

  /// @inheritdoc IMesonSwap
  function unbondSwap(bytes32 swapId) public override swapExists(swapId) {}

  /// @inheritdoc IMesonSwap
  function executeSwap(
    bytes32 swapId,
    bytes memory signature,
    uint256 epoch
  ) public override swapExists(swapId) swapBonded(swapId) {
    bytes32 swapHash = _getSwapHash(swapId, epoch);
    _checkSignature(signature, swapHash, requests[swapId].provider);

    uint256 amount = requests[swapId].amount;
    uint256 metaAmount = requests[swapId].metaAmount;
    address inToken = requests[swapId].inToken;
    address provider = requests[swapId].provider;

    _updateDemand(inToken, metaAmount);
    _deleteRequest(swapId);
    emit RequestExecuted(swapId);

    _safeTransfer(inToken, provider, amount);
  }

  function _deleteRequest(bytes32 swapId) internal {
    delete requests[swapId];
  }

  /// @inheritdoc IMesonSwap
  function cancelSwap(bytes32 swapId)
    public
    override
    swapExists(swapId)
    swapUnbondedOrExpired(swapId)
  {
    // TODO
  }

  function _newRequest(
    bytes32 swapId,
    uint256 amount,
    uint256 metaAmount,
    address inToken,
    bytes4 chain,
    bytes memory outToken,
    bytes memory receiver
  ) internal {
    requests[swapId] = SwapRequest({
      amount: amount,
      metaAmount: metaAmount,
      inToken: inToken,
      chain: chain,
      outToken: outToken,
      receiver: receiver,
      provider: address(0),
      bondUntil: 0
    });
  }

  /// @dev Check the swap for the given swapId exsits
  modifier swapExists(bytes32 swapId) {
    require(_swapExists(swapId), "swap not found");
    _;
  }

  /// @dev Check the swap is bonded
  modifier swapBonded(bytes32 swapId) {
    require(_isSwapBonded(swapId), "swap not bonded");
    _;
  }

  /// @dev Check the swap is unbonded or expired
  modifier swapUnbondedOrExpired(bytes32 swapId) {
    // TODO: get requests[swapId] first and pass down may save gas?
    require(!_isSwapBonded(swapId) || _isSwapExpired(swapId), "swap bonded");
    _;
  }

  function _swapExists(bytes32 swapId) internal view returns (bool) {
    return requests[swapId].metaAmount > 0;
  }

  function _isSwapBonded(bytes32 swapId) internal view returns (bool) {
    return requests[swapId].provider != address(0);
  }

  function _isSwapExpired(bytes32 swapId) internal view returns (bool) {
    return requests[swapId].bondUntil < block.timestamp;
  }
}
