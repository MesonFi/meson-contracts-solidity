// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../utils/MesonHelpers.sol";

contract MesonHelpersTest is MesonHelpers {
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

  function getSwapId(uint256 encodedSwap) external view returns (bytes32) {
    return _getSwapId(encodedSwap, DOMAIN_SEPARATOR);
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
    bytes32 swapId,
    address signer,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) public pure {
    require(signer == ecrecover(swapId, v, r, s), "invalid signature");
  }

  function checkReleaseSignature(
    bytes32 swapId,
    address recipient,
    address signer,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) public view {
    _checkReleaseSignature(swapId, keccak256(abi.encodePacked(recipient)), DOMAIN_SEPARATOR, signer, r, s, v);
  }
}
