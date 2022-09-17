// SPDX-License-Identifier: MIT
pragma solidity =0.8.16;

import "../utils/MesonStates.sol";

contract MesonStatesTest is MesonStates {
  function addSupportToken(address token, uint8 index) external {
    _addSupportToken(token, index);
  }

  function encodeSwap(
    uint8 version,
    uint40 amount,
    uint80 salt,
    uint40 fee,
    uint40 expireTs,
    bytes2 outChain,
    uint8 outToken,
    bytes2 inChain,
    uint8 inToken
  ) external pure returns (bytes memory) {
    return
      abi.encodePacked(
        version,
        amount,
        salt,
        fee,
        expireTs,
        outChain,
        outToken,
        inChain,
        inToken
      );
  }

  function decodeSwap(uint256 encodedSwap, uint40 poolIndex) external pure returns (
    uint8 version,
    uint256 amount,
    uint256 feeForLp,
    uint256 serviceFee,
    uint80 salt,
    uint256 expireTs,
    bytes2 inChain,
    uint8 inTokenIndex,
    bytes2 outChain,
    uint8 outTokenIndex,
    bytes6 poolTokenIndexForOutToken
  ) {
    version = _versionFrom(encodedSwap);
    amount = _amountFrom(encodedSwap);
    feeForLp = _feeForLp(encodedSwap);
    serviceFee = _serviceFee(encodedSwap);
    salt = _saltFrom(encodedSwap);
    expireTs = _expireTsFrom(encodedSwap);
    inChain = bytes2(_inChainFrom(encodedSwap));
    inTokenIndex = _inTokenIndexFrom(encodedSwap);
    outChain = bytes2(_outChainFrom(encodedSwap));
    outTokenIndex = _outTokenIndexFrom(encodedSwap);
    poolTokenIndexForOutToken = bytes6(_poolTokenIndexForOutToken(encodedSwap, poolIndex));
  }

  function decodePostedSwap(uint200 postedSwap) external pure returns (
    address initiator,
    uint40 poolIndex
  ) {
    initiator = _initiatorFromPosted(postedSwap);
    poolIndex = _poolIndexFromPosted(postedSwap);
  }

  function lockedSwapFrom(uint256 until, uint40 poolIndex) external pure returns (uint80) {
    return _lockedSwapFrom(until, poolIndex);
  }

  function decodeLockedSwap(uint80 lockedSwap) external pure returns (uint40 poolIndex, uint256 until) {
    poolIndex = _poolIndexFromLocked(lockedSwap);
    until = _untilFromLocked(lockedSwap);
  }

  function poolTokenIndexFrom(uint8 tokenIndex, uint40 poolIndex) external pure returns (bytes6) {
    return bytes6(_poolTokenIndexFrom(tokenIndex, poolIndex));
  }

  function decodePoolTokenIndex(uint48 poolTokenIndex) external pure returns (
    uint8 tokenIndex,
    uint40 poolIndex
  ) {
    tokenIndex = _tokenIndexFrom(poolTokenIndex);
    poolIndex = _poolIndexFrom(poolTokenIndex);
  }

  function checkRequestSignature(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) external pure {
    _checkRequestSignature(encodedSwap, r, s, v, signer);
  }

  function checkReleaseSignature(
    uint256 encodedSwap,
    address recipient,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) external pure {
    _checkReleaseSignature(encodedSwap, recipient, r, s, v, signer);
  }
}
