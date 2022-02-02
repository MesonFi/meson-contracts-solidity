// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "./MesonTokens.sol";
import "./MesonHelpers.sol";

/// @title MesonStates
/// @notice The class that keeps track of token supplies and swap requests,
contract MesonStates is MesonTokens, MesonHelpers {
  mapping(address => uint40) public indexOfAddress;
  mapping(uint40 => address) public addressOfIndex;

  mapping(uint48 => uint256) internal _tokenBalanceOf;

  function balanceOf(address token, address addr) external view returns (uint256) {
    uint8 tokenIndex = _indexOfToken[token];
    uint40 providerIndex = indexOfAddress[addr];
    return _tokenBalanceOf[(uint48(tokenIndex) << 40) | providerIndex];
  }
}
