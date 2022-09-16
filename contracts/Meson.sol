// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "./Swap/MesonSwap.sol";
import "./Pools/MesonPools.sol";

contract Meson is MesonSwap, MesonPools {
  constructor(address[] memory tokens, uint8[] memory indexes) {
    require(tokens.length == indexes.length, "Tokens and indexes should have the same length");
    for (uint8 i = 0; i < tokens.length; i++) {
      _addSupportToken(tokens[i], indexes[i]);
    }
  }
}
