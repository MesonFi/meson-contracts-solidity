// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../Pools/MesonPools.sol";

contract MesonPoolsTest is MesonPools {
  function addTokenToSwapList(address token) external {
    _addTokenToSwapList(token);
  }

  function hasLockedSwap(bytes32 swapId) external view returns (bool) {
    return _lockedSwaps[swapId].providerIndex != 0;
  }
}
