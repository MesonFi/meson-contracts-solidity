// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../utils/MesonStates.sol";

contract MesonStatesTest is MesonStates {
  function encodeSwap(
    uint96 amount,
    uint32 salt,
    uint40 fee,
    uint40 expireTs,
    bytes2 outChain,
    uint8 outToken,
    bytes2 inChain,
    uint8 inToken
  ) external pure returns (bytes memory) {
    return
      abi.encodePacked(
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

  function decodeSwap(uint256 encodedSwap) external pure returns (
    uint96 amount,
    uint32 salt,
    uint40 expireTs,
    bytes2 outChain,
    uint8 outTokenIndex,
    bytes2 inChain,
    uint8 inTokenIndex
  ) {
    amount = uint96(encodedSwap >> 160);
    salt = uint32(encodedSwap >> 128);
    expireTs = uint40(encodedSwap >> 48);
    outChain = bytes2(uint16(encodedSwap >> 32));
    outTokenIndex = uint8(encodedSwap >> 24);
    inChain = bytes2(uint16(encodedSwap >> 8));
    inTokenIndex = uint8(encodedSwap);
  }

  function checkRequestSignature(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) public pure {
    _checkRequestSignature(encodedSwap, r, s, v, signer);
  }

  function checkReleaseSignature(
    uint256 encodedSwap,
    address recipient,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) public pure {
    _checkReleaseSignature(encodedSwap, keccak256(abi.encodePacked(recipient)), r, s, v, signer);
  }
}
