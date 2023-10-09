// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/// @title MesonTokens
/// @notice The class that stores the information of Meson's supported tokens
contract MesonTokens {
  /// @notice The whitelist of supported tokens in Meson
  /// Meson use a whitelist for supported stablecoins, which is specified on first deployment
  /// or added through `_addSupportToken` Only modify this mapping through `_addSupportToken`.
  /// key: `tokenIndex` in range of 1-255
  ///     0:       unsupported
  ///     1-32:    stablecoins with decimals 6
  ///     33-240:  stablecoins with decimals 18
  ///     241-254: ETH equivalent
  ///     255:     core token (mostly ETH)
  /// value: the supported token's contract address
  mapping(uint8 => address) public tokenForIndex;


  /// @notice The mapping to get `tokenIndex` from a supported token's address
  /// Only modify this mapping through `_addSupportToken`.
  /// key: the supported token's contract address
  /// value: `tokenIndex` in range of 1-255
  ///     0:       unsupported
  ///     1-32:    stablecoins with decimals 6
  ///     33-240:  stablecoins with decimals 18
  ///     241-254: ETH equivalent
  ///     255:     core token (mostly ETH)
  mapping(address => uint8) public indexOfToken;

  /// @dev This empty reserved space is put in place to allow future versions to
  /// add new variables without shifting down storage in the inheritance chain.
  /// See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
  uint256[50] private __gap;

  /// @notice Return all supported token addresses in an array ordered by `tokenIndex`
  /// This method will only return tokens with consecutive token indexes.
  function getSupportedTokens() external view returns (address[] memory tokens, uint8[] memory indexes) {
    uint8 i;
    uint8 num;
    for (i = 0; i < 255; i++) {
      if (tokenForIndex[i+1] != address(0)) {
        num++;
      }
    }
    tokens = new address[](num);
    indexes = new uint8[](num);
    uint8 j = 0;
    for (i = 0; i < 255; i++) {
      if (tokenForIndex[i+1] != address(0)) {
        tokens[j] = tokenForIndex[i+1];
        indexes[j] = i+1;
        j++;
      }
    }
  }

  function _addSupportToken(address token, uint8 index) internal {
    require(index != 0, "Cannot use 0 as token index");
    require(token != address(0), "Cannot use zero address");
    require(indexOfToken[token] == 0, "Token has been added before");
    require(tokenForIndex[index] == address(0), "Index has been used");
    if (index == 255) {
      require(token == address(0x1), "Token index 255 (ETH) requires adddress(0x1)");
    }
    indexOfToken[token] = index;
    tokenForIndex[index] = token;
  }

  function _removeSupportToken(uint8 index) internal {
    require(index != 0, "Cannot use 0 as token index");
    address token = tokenForIndex[index];
    require(token != address(0), "Token for the index does not exist");
    delete indexOfToken[token];
    delete tokenForIndex[index];
  }
}
