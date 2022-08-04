// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../Swap/MesonSwap.sol";

contract MesonSwapTest is MesonSwap {
  constructor(address token) {
    _addSupportToken(token, 1);
  }

  function register(uint40 poolIndex) external {
    address provider = _msgSender();
    require(poolIndex != 0, "Cannot use index 0");
    require(ownerOfPool[poolIndex] == address(0), "Pool index already registered");
    require(poolOfPermissionedAddr[provider] == 0, "Signer address already registered");
    ownerOfPool[poolIndex] = provider;
    poolOfPermissionedAddr[provider] = poolIndex;
  }
}
