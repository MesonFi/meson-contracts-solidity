// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../libraries/LowGasSafeMath.sol";
import "./MesonHelpers.sol";

/// @title MesonStates
/// @notice The class that keeps track of token supplies and swap requests,
contract MesonStates is MesonHelpers {
  mapping(address => bool) internal _supportedTokens;
  address[] internal _tokenListByHash;

  mapping(bytes32 => address) internal _tokenAddressByHash;
  mapping(address => bytes32) internal _tokenHashByAddress;

  mapping(bytes32 => mapping(uint32 => uint128)) internal _tokenBalanceOf;

  mapping(address => uint32) public indexOfAddress;
  mapping(uint32 => address) public addressOfIndex;

  function balanceOf(address token, address addr) external view returns (uint128) {
    bytes32 tokenHash = _tokenHashByAddress[token];
    uint32 index = indexOfAddress[addr];
    return _tokenBalanceOf[tokenHash][index];
  }

  function _addTokenToSwapList(address token) internal {
    _supportedTokens[token] = true;
    bytes32 tokenHash = keccak256(abi.encodePacked(token));
    _tokenAddressByHash[tokenHash] = token;
    _tokenHashByAddress[token] = tokenHash;
  }

  modifier tokenSupported(address token) {
    require(_supportedTokens[token], "unsupported token");
    _;
  }
}
