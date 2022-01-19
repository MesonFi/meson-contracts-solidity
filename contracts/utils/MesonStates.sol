// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Context.sol";

import "../libraries/LowGasSafeMath.sol";

import "./MesonHelpers.sol";

/// @title MesonStates
/// @notice The class that keeps track of token supplies and swap requests,
contract MesonStates is Context, MesonHelpers {
  mapping(address => bool) internal _supportedTokens;
  address[] public tokens;

  mapping(address => uint32) public indexOfAddress;
  mapping(uint32 => address) public addressOfIndex;

  mapping(address => mapping(address => uint128)) public balanceOf;

  function registerAddress(uint32 index) external {
    address addr = _msgSender();
    require(index > 0, "Cannot use index 0");
    require(addressOfIndex[index] == address(0), "Index already registered");
    require(indexOfAddress[addr] == 0, "Address already registered");
    addressOfIndex[index] = addr;
    indexOfAddress[addr] = index;
  }

  function _addTokenToSwapList(address token) internal {
    _supportedTokens[token] = true;
    tokens.push(token);
  }

  modifier tokenSupported(address token) {
    require(_supportedTokens[token], "unsupported token");
    _;
  }
}
