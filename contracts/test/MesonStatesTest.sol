// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../utils/MesonHelpers.sol";
import "../utils/MesonStates.sol";

contract MesonStatesTest is MesonStates {
  constructor(address token) {
    _addSupportToken(token, 1);
  }
}
