// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../libraries/LowGasSafeMath.sol";

import "./MesonHelpers.sol";

/// @title MesonStates
/// @notice The class that keeps track of token supplies and swap requests,
contract MesonStates is MesonHelpers {
  mapping(address => bool) public supportedTokens;

  mapping(address => mapping(address => uint128)) public balanceOf;

  function _addTokenToSwapList(address token) internal {
    supportedTokens[token] = true;
  }

  modifier tokenSupported(address token) {
    require(supportedTokens[token], "unsupported token");
    _;
  }
}
