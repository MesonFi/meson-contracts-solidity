// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../Swap/MesonSwap.sol";

contract MesonSwapTest is MesonSwap {
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

  function addSupportToken(address token) external {
    _addSupportToken(token);
  }

  function hasSwap(bytes32 swapId) external view returns (bool) {
    return _swapRequests[swapId].initiator != address(0);
  }
}
