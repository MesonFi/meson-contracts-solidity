// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.6;

import "../Pools/MesonPools.sol";

contract MesonPoolsTest is MesonPools {
  function addTokenToSwapList(address token) external {
    _addTokenToSwapList(token);
  }
}
