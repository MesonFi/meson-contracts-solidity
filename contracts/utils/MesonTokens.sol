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
  ///       1, 9:    USDC, USDC.e
  ///       2, 10:   USDT, USDT.e
  ///       3:       BUSD, USDT.e
  ///       17:      PoD USDC
  ///       18:      PoD USDT
  ///       19:      PoD BUSD
  ///       32:      PoD
  ///     33-64:   stablecoins with decimals 18
  ///       33:      USDC
  ///       34:      USDT
  ///       35:      BUSD
  ///     65-128:  (Unspecified)
  ///     129-190: (Unspecified)
  ///     191:     No-swap core
  ///     192-247: (Unspecified)
  ///     248-251: BNB & BNB equivalent
  ///       248:     PoD BNB
  ///       250:     (reserved for ERC20 BNB)
  ///       251:     BNB as core
  ///     252-255: ETH & ETH equivalent
  ///       252:     PoD ETH
  ///       254:     (reserved for ERC20 ETH like WETH)
  ///       255:     ETH as core
  /// value: the supported token's contract address
  mapping(uint8 => address) public tokenForIndex;


  /// @notice The mapping to get `tokenIndex` from a supported token's address
  /// Only modify this mapping through `_addSupportToken`.
  /// key: the supported token's contract address
  /// value: `tokenIndex` in range of 1-255
  mapping(address => uint8) public indexOfToken;

  /// @dev This empty reserved space is put in place to allow future versions to
  /// add new variables without shifting down storage in the inheritance chain.
  /// See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
  uint256[50] private __gap;

  function _isCoreToken(uint8 tokenIndex) internal returns (bool) {
    return (tokenIndex > 190) && ((tokenIndex % 4) == 3);
  }

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
    if (_isCoreToken(index)) {
      require(token == address(0x1), "Core token requires adddress(0x1)");
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
