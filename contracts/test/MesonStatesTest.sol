// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../utils/MesonStates.sol";

contract MesonStatesTest is MesonStates {
  constructor(address token) {
    _addTokenToSwapList(token);
  }

  function increaseSupply(address token, uint256 amount) public {
    _increaseSupply(token, amount);
  }

  function decreaseSupply(address token, uint256 amount) public {
    _decreaseSupply(token, amount);
  }
}
