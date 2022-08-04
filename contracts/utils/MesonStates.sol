// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "./MesonTokens.sol";
import "./MesonHelpers.sol";

/// @title MesonStates
/// @notice The class that keeps track of states
contract MesonStates is MesonTokens, MesonHelpers {
  /// @notice The mapping from *permissioned* addresses to LP pool indexes
  /// Each LP pool in Meson has an index `i` and each LP needs to register an pool index at
  /// initial deposit by calling `depositAndRegister`. The balance for each LP pool is tracked by its
  /// pool index (see `_tokenBalanceOf`).
  ///
  /// This mapping records the relation between *permissioned* addresses and pool indexes, where
  /// permissioned addresses are those who have the permision to match and complete a swap with funds 
  /// in a pool with specific index. For example, for an LP pool with index `i` there could be multiple
  /// addresses that `indexOfAddress[address] = i`, which means these addresses can all sign to match
  /// (call `bondSwap`, `lock`) a swap and complete it (call `release`) with funds in pool_i. That helps
  /// an LP to give other addresses the permission to perform daily swap transactions. However, permissioned
  /// addresses cannot withdraw funds from the LP pool, unless it's given in `addressOfIndex`
  /// which records the *owner* address for each pool.
  ///
  /// The index 0 is reserved for use by Meson
  mapping(address => uint40) public indexOfAddress;

  /// @notice The mapping from LP pool indexes to their owner addresses
  /// See `indexOfAddress` to understand how pool index is defined and used.
  /// 
  /// This mapping records the *owner* address for each lp pool. Only the owner address can withdraw funds
  /// from its corresponding LP pool.
  ///
  /// The index 0 is reserved for use by Meson
  mapping(uint40 => address) public addressOfIndex;

  /// @notice Balance for each LP tracked by the pool index
  /// See `indexOfAddress` to understand how pool index is defined and used.
  ///
  /// The balance for an LP pool is `_tokenBalanceOf[i]` in which `i` is the pool index
  /// for that LP such that `addressOfIndex[i] = lp_address`. This design is for saving gas.
  ///
  /// The index 0 is reserved for use by Meson
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
