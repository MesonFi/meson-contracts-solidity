// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @title MesonTokens
contract MesonTokens {
  mapping(address => bool) internal _supportedTokens;
  address[] internal _tokenList;
  bytes32[] internal _tokenHashList;

  mapping(address => uint8) internal _indexOfToken;

  mapping(bytes32 => address) internal _tokenAddressByHash;
  mapping(address => bytes32) internal _tokenHashByAddress;

  function tokenForIndex(uint8 tokenIndex) external view returns (address) {
    return _tokenList[tokenIndex];
  }

  function indexOfToken(address token) external view returns (uint8) {
    return _indexOfToken[token];
  }

  function _addSupportToken(address token) internal {
    // TODO: make sure only 16 tokens can be added
    _supportedTokens[token] = true;
    bytes32 tokenHash = keccak256(abi.encodePacked(token));
    _indexOfToken[token] = uint8(_tokenList.length);
    _tokenList.push(token);
    _tokenHashList.push(tokenHash);

    _tokenAddressByHash[tokenHash] = token;
    _tokenHashByAddress[token] = tokenHash;
  }

  modifier tokenSupported(address token) {
    require(_supportedTokens[token], "unsupported token");
    _;
  }
}
