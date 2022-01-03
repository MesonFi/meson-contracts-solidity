// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../Swap/MesonSwap.sol";

contract MesonSwapTest is MesonSwap {
  function addTokenToSwapList(address token) external {
    _addTokenToSwapList(token);
  }

  function hasSwap(bytes32 swapId) external view returns (bool) {
    return _hasSwap(swapId);
  }
}
