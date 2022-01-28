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

  mapping(bytes32 => mapping(uint32 => uint128)) internal _tokenBalanceOf;

  mapping(address => uint32) public indexOfAddress;
  mapping(uint32 => address) public addressOfIndex;

  mapping(address => mapping(uint32 => uint128)) public balanceOf;

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
    bytes32 tokenHash = keccak256(abi.encodePacked(token));
    _tokenAddressByHash[tokenHash] = token;
    // _tokenListByHash.push(tokenHash);
  }

  modifier tokenSupported(address token) {
    require(_supportedTokens[token], "unsupported token");
    _;
  }
}
