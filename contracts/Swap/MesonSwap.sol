// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "../libraries/LowGasSafeMath.sol";
import "../interfaces/IERC20Minimal.sol";
import "../libraries/BytesLib.sol";

import "../MesonConfig.sol";
import "./IMesonSwap.sol";
import "./MesonSwapStore.sol";
import "../Pricing/MesonPricing.sol";

/// @title MesonSwap
/// @notice The class to receive and process swap requests.
/// Methods in this class will be executed by users or LPs when
/// users initiate swaps in the current chain.
contract MesonSwap is
  Context,
  MesonConfig,
  IMesonSwap,
  MesonSwapStore,
  MesonPricing
{
  uint256 public lockingAmount;
  uint256 public swaped;

  /// @inheritdoc IMesonSwap
  function requestSwap(
    uint256 amount,
    address inToken,
    string memory chain,
    string memory outToken,
    string memory receiver
  ) public override tokenSupported(inToken) returns (bytes32) {
    // TODO: how to allow contracts to use and make sure it is safe?

    uint256 metaAmount = _toMetaAmount(inToken, amount);
    bytes32 swapId = _getSwapId(metaAmount, inToken, chain, outToken, receiver);
    require(!_swapExists(swapId), "swap conflict");

    address provider = _msgSender();
    lockingAmount = LowGasSafeMath.add(lockingAmount, amount);

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
    bytes32 swapHash = keccak256(abi.encodePacked(swapId, ":", Strings.toString(epoch)));
    require(
      ECDSA.recover(swapHash, signature) == requests[swapId].provider,
      "invalid signature"
    );

    uint256 amount = requests[swapId].amount;
    address inToken = requests[swapId].inToken;
    address provider = requests[swapId].provider;

    _updateDemand(inToken, amount);

    IERC20Minimal(inToken).transferFrom(address(this), provider, amount);

    emit RequestExecuted(swapId);
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

  /// @dev Check the swap for the given swapId exsits
  modifier swapExists(bytes32 swapId) {
    require(_swapExists(swapId), "swap not found");
    _;
  }

  /// @dev Check the swap is bonded
  modifier swapBonded(bytes32 swapId) {
    require(_swapIsBonded(swapId), "swap not bonded");
    _;
  }

  /// @dev Check the swap is not expired
  modifier swapNotExpired(bytes32 swapId) {
    require(!_swapIsExpired(swapId), "swap is expired");
    _;
  }

  /// @dev Check the swap is unbonded or expired
  modifier swapUnbondedOrExpired(bytes32 swapId) {
    // TODO: get requests[swapId] first and pass down may save gas?
    require(!_swapIsBonded(swapId) || _swapIsExpired(swapId), "swap not bonded or expired");
    _;
  }

  function _swapExists(bytes32 swapId) private returns (bool) {
    return requests[swapId].metaAmount > 0;
  }

  function _swapIsBonded(bytes32 swapId) private returns (bool) {
    return requests[swapId].provider != address(0);
  }

  function _swapIsExpired(bytes32 swapId) private returns (bool) {
    return requests[swapId].bondUntil >= block.timestamp;
  }
}
