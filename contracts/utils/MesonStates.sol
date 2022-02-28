// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "./MesonTokens.sol";
import "./MesonHelpers.sol";

/// @title MesonStates
/// @notice The class that keeps track of states
contract MesonStates is MesonTokens, MesonHelpers {
  mapping(address => uint40) public indexOfAddress;
  mapping(uint40 => address) public addressOfIndex;

  mapping(uint48 => uint256) internal _tokenBalanceOf;

  function balanceOf(address token, address addr) external view returns (uint256) {
    uint8 tokenIndex = _indexOfToken[token];
    uint40 providerIndex = indexOfAddress[addr];
    if (providerIndex == 0 || tokenIndex == 0) {
      return 0;
    }
    return _tokenBalanceOf[_balanceIndexFrom(tokenIndex, providerIndex)];
  }
  
  function mesonFeeCollected(uint8 tokenIndex) external view returns (uint256) {
    return _tokenBalanceOf[_balanceIndexFrom(tokenIndex, 0)];
  }
}
