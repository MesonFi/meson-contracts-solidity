// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @title MesonTokens
contract MesonTokens {
  mapping(address => bool) internal _supportedTokens;

  mapping(uint8 => address) internal _tokenList;
  mapping(address => uint8) internal _indexOfToken;

  function tokenForIndex(uint8 tokenIndex) external view returns (address) {
    return _tokenList[tokenIndex];
  }

  function indexOfToken(address token) external view returns (uint8) {
    return _indexOfToken[token];
  }

  function _addSupportToken(address token, uint8 index) internal {
    _supportedTokens[token] = true;
    _indexOfToken[token] = index;
    _tokenList[index] = token;
  }

  modifier tokenSupported(address token) {
    require(_supportedTokens[token], "unsupported token");
    _;
  }
}
