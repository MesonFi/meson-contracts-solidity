// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @title MesonTokens
/// @notice The class that stores the information of Meson's supported tokens
contract MesonTokens {
  /// @notice The whitelist of supported tokens in Meson
  /// Meson use a whitelist for supported stablecoins, which is specified on first deployment
  /// or added through `_addSupportToken` Only modify this mapping through `_addSupportToken`.
  /// key: `tokenIndex` in range of 1-255; zero means unsupported
  /// value: the supported token's contract address
  mapping(uint8 => address) internal _tokenList;


  /// @notice The mapping to get `tokenIndex` from a supported token's address
  /// Only modify this mapping through `_addSupportToken`.
  /// key: the supported token's contract address
  /// value: `tokenIndex` in range of 1-255; zero means unsupported
  mapping(address => uint8) internal _indexOfToken;

  /// @dev This empty reserved space is put in place to allow future versions to
  /// add new variables without shifting down storage in the inheritance chain.
  /// See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
  uint256[10] private __gap;

  function tokenForIndex(uint8 tokenIndex) external view returns (address) {
    return _tokenList[tokenIndex];
  }

  function indexOfToken(address token) external view returns (uint8) {
    return _indexOfToken[token];
  }

  /// @notice Return all supported token addresses in an array ordered by `tokenIndex`
  /// This method will only return tokens with consecutive token indexes.
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
    require(token != address(0), "Cannot use zero address");
    require(_indexOfToken[token] == 0, "Token has been added before");
    require(_tokenList[index] == address(0), "Index has been used");
    _indexOfToken[token] = index;
    _tokenList[index] = token;
  }
}
