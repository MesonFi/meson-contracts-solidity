// SPDX-License-Identifier: MIT
pragma solidity =0.8.16;

import "../Swap/MesonSwap.sol";

contract MesonSwapTest is MesonSwap {
  constructor(address token) {
    _addSupportToken(token, 1);
  }

  function register(uint40 poolIndex) external {
    address poolOwner = _msgSender();
    require(poolIndex != 0, "Cannot use index 0");
    require(ownerOfPool[poolIndex] == address(0), "Pool index already registered");
    require(poolOfAuthorizedAddr[poolOwner] == 0, "Signer address already registered");
    ownerOfPool[poolIndex] = poolOwner;
    poolOfAuthorizedAddr[poolOwner] = poolIndex;
  }
}
