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
    bytes32 encodedSwap,
    address signer,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) public pure {
    bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", encodedSwap));
    require(signer == ecrecover(digest, v, r, s), "Invalid signature");
  }

  function checkReleaseSignature(
    uint256 encodedSwap,
    address recipient,
    address signer,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) public view {
    _checkReleaseSignature(encodedSwap, recipient, DOMAIN_SEPARATOR, r, s, v, signer);
  }
}
