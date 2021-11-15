// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "../libraries/LowGasSafeMath.sol";
import "../interfaces/IERC20Minimal.sol";

import "./IMesonPools.sol";
import "../Pricing/MesonPricing.sol";

/// @title MesonPools
contract MesonPools is Context, MesonPricing, IMesonPools {
  mapping(address => mapping(address => uint256)) public balanceOf;

  mapping(address => uint256) public epochOf;
  mapping(address => uint256) public epochTsOf;
  mapping(address => uint256) public releasedInEpochOf;

  /// @inheritdoc IMesonPools
  function deposit(address token, uint256 amount)
    public
    override
    tokenSupported(token)
  {
    address provider = _msgSender(); // this may not be the correct msg.sender
    balanceOf[token][provider] = LowGasSafeMath.add(
      balanceOf[token][provider],
      amount
    );
    _increaseSupply(token, amount);
    _transferToken(token, provider, address(this), amount);
  }

  /// @inheritdoc IMesonPools
  function withdraw(address token, uint256 amount)
    public
    override
    tokenSupported(token)
  {
    address provider = _msgSender(); // this may not be the correct msg.sender
    _decreaseSupply(token, amount);
    _withdrawTo(provider, provider, token, amount);
  }

  function _withdrawTo(
    address receiver,
    address provider,
    address token,
    uint256 amount
  ) private {
    require(balanceOf[token][provider] > amount, "overdrawn");

    uint256 newReleased = LowGasSafeMath.add(releasedInEpochOf[provider], amount);
    require(newReleased < MAX_RELEASE_AMOUNT_BY_EPOCH, "overdrawn in epoch");
    releasedInEpochOf[provider] = newReleased;

    balanceOf[token][provider] = LowGasSafeMath.sub(
      balanceOf[token][provider],
      amount
    );
    _transferToken(token, address(this), receiver, amount);
  }

  function _transferToken(
    address token,
    address sender,
    address receiver,
    uint256 amount
  ) private {
    IERC20Minimal(token).transferFrom(sender, receiver, amount); // test this is a valid token
  }

  /// @inheritdoc IMesonPools
  function pause() public override {}

  /// @inheritdoc IMesonPools
  function unpause() public override {}

  /// @inheritdoc IMesonPools
  function release(
    address provider,
    bytes memory signature,
    uint256 metaAmount,
    string memory inToken,
    address outToken,
    address receiver,
    uint256 epoch
  ) public override {
    if (epoch == epochOf[provider] + 1) { // epoch can only increment by 1
      uint256 ts = block.timestamp;
      require(epochTsOf[provider] + EPOCH_TIME_PERIOD < ts, "increment epoch too fast");
      epochOf[provider] = epoch;
      epochTsOf[provider] = ts;
      releasedInEpochOf[provider] = 0;
    }

    require(epoch == epochOf[provider], "invalid epoch");
    require(
      _isSignatureValid(
        provider,
        signature,
        metaAmount,
        inToken,
        outToken,
        receiver,
        epoch
      ),
      "invalid signature"
    );

    uint256 amount = _fromMetaAmount(outToken, metaAmount);
    _withdrawTo(receiver, provider, outToken, amount);
  }

  /// @inheritdoc IMesonPools
  function challenge(
    address provider,
    bytes memory signature,
    uint256 metaAmount,
    string memory inToken,
    address outToken,
    address receiver,
    uint256 epoch
  ) public override {
    require(
      _isSignatureValid(
        provider,
        signature,
        metaAmount,
        inToken,
        outToken,
        receiver,
        epoch
      ),
      "invalid signature"
    );
    // TODO
  }

  function _isSignatureValid(
    address provider,
    bytes memory signature,
    uint256 metaAmount,
    string memory inToken,
    address outToken,
    address receiver,
    uint256 epoch
  ) private returns (bool) {
    bytes32 swapId =
      _getSwapIdAsProvider(metaAmount, inToken, outToken, receiver);
    bytes32 swapHash = keccak256(abi.encodePacked(swapId, epoch));
    require(
      ECDSA.recover(swapHash, signature) == provider,
      "invalid signature"
    );
    return true;
  }
}
