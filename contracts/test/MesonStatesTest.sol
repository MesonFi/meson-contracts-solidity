// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../utils/MesonStates.sol";

contract MesonStatesTest is MesonStates {
  constructor() {
    DOMAIN_SEPARATOR =
      keccak256(
        abi.encode(
          EIP712_DOMAIN_TYPEHASH,
          keccak256(bytes("Meson Fi")),
          keccak256(bytes("1")),
          block.chainid,
          address(this)
        )
      );
  }

  function encodeSwap(
    uint128 amount,
    uint40 fee,
    uint40 expireTs,
    bytes4 outChain,
    uint8 outToken,
    uint8 inToken
  ) external pure returns (bytes memory) {
    return
      abi.encodePacked(
        amount,
        fee,
        expireTs,
        outChain,
        outToken,
        inToken
      );
  }

  function decodeSwap(uint256 encodedSwap) external pure
    returns (uint128 amount, uint40 expireTs, uint8 inTokenIndex, uint8 outTokenIndex)
  {
    amount = uint128(encodedSwap >> 128);
    expireTs = uint40(encodedSwap >> 48);
    inTokenIndex = uint8(encodedSwap);
    outTokenIndex = uint8(encodedSwap >> 8);
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
  ) public view {
    _checkReleaseSignature(encodedSwap, recipient, DOMAIN_SEPARATOR, r, s, v, signer);
  }
}
