// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../Pools/MesonPools.sol";

contract MesonPoolsTest is MesonPools {
  constructor(address token) {
    _addSupportToken(token, 0);
  }

  function hasLockedSwap(bytes32 swapId) external view returns (bool) {
    return _lockedSwaps[swapId] != 0;
  }
}
