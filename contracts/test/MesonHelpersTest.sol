// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../utils/MesonHelpers.sol";

contract MesonHelpersTest is MesonHelpers {
  function getSwapId(
    uint256 expireTs,
    address inToken,
    uint256 amount,
    bytes4 outChain,
    bytes memory outToken,
    bytes memory recipient
  ) external pure returns (bytes32) {
    return _getSwapId(expireTs, inToken, amount, outChain, outToken, recipient);
  }

  function encodeSwap(
    uint256 expireTs,
    bytes memory inToken,
    uint256 amount,
    bytes4 outChain,
    bytes memory outToken,
    bytes memory recipient
  ) external pure returns (bytes memory) {
    return _encodeSwap(expireTs, inToken, amount, outChain, outToken, recipient);
  }

  function decodeSwap(bytes memory encodedSwap)
    external
    pure
    returns (uint256, bytes32, uint256)
  {
    return _decodeSwap(encodedSwap);
  }

  function checkRequestSignature(
    bytes32 swapId,
    address signer,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) public view {
    _checkRequestSignature(swapId, signer, r, s, v);
  }

  function checkReleaseSignature(
    bytes32 swapId,
    address signer,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) public view {
    _checkReleaseSignature(swapId, signer, r, s, v);
  }

  function getCurrentChain() external pure returns (bytes4) {
    return CURRENT_CHAIN;
  }
}
