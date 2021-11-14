// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "../libraries/LowGasSafeMath.sol";
import "../interfaces/IERC20Minimal.sol";
import "../libraries/BytesLib.sol";

import "../MesonConfig.sol";
import "./IMesonSwap.sol";
import "./MesonSwapStore.sol";
import "../Pricing/MesonPricing.sol";

contract MesonSwap is
  Context,
  MesonConfig,
  IMesonSwap,
  MesonSwapStore,
  MesonPricing
{
  uint256 public lockingAmount;
  uint256 public swaped;

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
    require(requests[swapId].metaAmount == 0, "swap conflict");

    address provider = _msgSender();
    lockingAmount = LowGasSafeMath.add(lockingAmount, amount);

    _newRequest(swapId, amount, metaAmount, inToken, chain, outToken, receiver);

    IERC20Minimal(inToken).transferFrom(provider, address(this), amount);
    return swapId;
  }

  function bondSwap(bytes32 swapId, address provider)
    public
    override
    swapExists(swapId)
    swapUnbonded(swapId)
  {
    requests[swapId].provider = provider;
    requests[swapId].bondUntil = LowGasSafeMath.add(
      block.timestamp,
      BOND_TIME_PERIOD
    );
  }

  function unbondSwap(bytes32 swapId) public override {}

  function executeSwap(
    bytes32 swapId,
    bytes memory signature,
    uint256 epoch
  ) public override swapExists(swapId) swapBonded(swapId) {
    bytes32 swapHash = keccak256(abi.encodePacked(swapId, epoch));
    require(
      ECDSA.recover(swapHash, signature) == requests[swapId].provider,
      "invalid signature"
    );

    uint256 amount = requests[swapId].amount;
    address inToken = requests[swapId].inToken;
    address provider = requests[swapId].provider;

    _updateDemand(inToken, amount);

    IERC20Minimal(inToken).transferFrom(address(this), provider, amount);
  }

  function cancelSwap(bytes32 swapId)
    public
    override
    swapExists(swapId)
    swapUnbonded(swapId)
  {
    // TODO
  }

  modifier swapExists(bytes32 swapId) {
    require(requests[swapId].metaAmount > 0, "swap not found");
    _;
  }

  modifier swapBonded(bytes32 swapId) {
    require(
      requests[swapId].provider != address(0) &&
        requests[swapId].bondUntil >= block.timestamp,
      "swap not bonded"
    );
    _;
  }

  modifier swapUnbonded(bytes32 swapId) {
    require(
      requests[swapId].provider == address(0) ||
        requests[swapId].bondUntil < block.timestamp,
      "swap not bonded"
    );
    _;
  }
}
