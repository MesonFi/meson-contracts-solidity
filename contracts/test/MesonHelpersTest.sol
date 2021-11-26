// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../utils/MesonHelpers.sol";

contract MesonHelpersTest is MesonHelpers {
  function getSwapHash(bytes32 swapId, uint256 epoch) public pure returns (bytes32) {
    return _getSwapHash(swapId, epoch);
  }

  function getSwapId(
    uint256 metaAmount,
    address inToken,
    bytes4 chain,
    bytes memory outToken,
    bytes memory receiver,
    uint256 ts
  ) public pure returns (bytes32) {
    return _getSwapId(
      metaAmount,
      inToken,
      chain,
      outToken,
      receiver,
      ts
    );
  }

  function getSwapIdAsProvider(
    uint256 metaAmount,
    bytes memory inToken,
    address outToken,
    address receiver,
    uint256 ts
  ) public pure returns (bytes32) {
    return _getSwapIdAsProvider(
      metaAmount,
      inToken,
      outToken,
      receiver,
      ts
    );
  }

  function checkSignature(
    bytes memory signature,
    bytes32 message,
    address signer
  ) public pure {
    _checkSignature(signature, message, signer);
  }
}
