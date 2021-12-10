// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "./Swap/MesonSwap.sol";
import "./Pools/MesonPools.sol";

contract Meson is MesonSwap, MesonPools {
  constructor(address[] memory _supportedTokens) {
    for (uint i = 0; i < _supportedTokens.length; i++) {
      _addTokenToSwapList(_supportedTokens[i]);
    }
  }
}
