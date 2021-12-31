// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../Swap/MesonSwap.sol";

contract MesonSwapTest is MesonSwap {
  function addTokenToSwapList(address token) external {
    _addTokenToSwapList(token);
  }

  function isSwapExist(bytes32 swapId) external view returns (bool) {
    return _isSwapExist(swapId);
  }
}