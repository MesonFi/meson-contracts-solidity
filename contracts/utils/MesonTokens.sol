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

  function supportedTokens() external view returns (address[] memory tokens) {
    uint8 len;
    for (len = 1; len < 256; len++) {
      if (_tokenList[len] == address(0)) {
        if (len == 1) {
          return tokens;
        }
        tokens = new address[](len - 1);
        break;
      }
    }
    for (uint8 i = 1; i < len; i++) {
      tokens[i - 1] = _tokenList[i];
    }
  }

  function _addSupportToken(address token, uint8 index) internal {
    require(index != 0, "Cannot use 0 as token index");
    _supportedTokens[token] = true;
    _indexOfToken[token] = index;
    _tokenList[index] = token;
  }

  modifier tokenSupported(address token) {
    require(_supportedTokens[token], "unsupported token");
    _;
  }
}
