// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../Pools/MesonPools.sol";

contract MesonPoolsTest is MesonPools {
  constructor(address token) {
    _addSupportToken(token, 1);
  }

  function hasLockedSwap(uint256 encodedSwap) external view returns (bool) {
    return _lockedSwaps[encodedSwap] != 0;
  }
}
