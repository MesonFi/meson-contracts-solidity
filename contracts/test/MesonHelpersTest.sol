// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../utils/MesonHelpers.sol";

contract MesonHelpersTest is MesonHelpers {
  function getSwapId(
    address inToken,
    uint256 amount,
    uint64 expireTs,
    bytes4 outChain,
    bytes memory outToken,
    bytes memory recipient
  ) external view returns (bytes32) {
    return _getSwapId(
      encodeSwap(
        abi.encodePacked(inToken),
        amount,
        expireTs,
        outChain,
        outToken,
        recipient
      )
    );
  }

  function encodeSwap(
    bytes memory inToken,
    uint256 amount,
    uint64 expireTs,
    bytes4 outChain,
    bytes memory outToken,
    bytes memory recipient
  ) public pure returns (bytes memory) {
    return
      abi.encode(
        SWAP_REQUEST_TYPEHASH,
        keccak256(inToken),
        amount,
        expireTs,
        outChain,
        keccak256(outToken),
        keccak256(recipient)
      );
  }

  function decodeSwapInput(bytes memory encodedSwap)
    external
    pure
    returns (uint256, bytes32, uint256)
  {
    return _decodeSwapInput(encodedSwap);
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
    address signer,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) public view {
    _checkReleaseSignature(swapId, signer, r, s, v);
  }
}
