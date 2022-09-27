// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./MesonTokens.sol";
import "./MesonHelpers.sol";

/// @title MesonStates
/// @notice The class that keeps track of LP pool states
contract MesonStates is MesonTokens, MesonHelpers {
  /// @notice The mapping from *authorized addresses* to LP pool indexes.
  /// See `ownerOfPool` to understand how pool index is defined and used.
  ///
  /// This mapping records the relation between *authorized addresses* and pool indexes, where
  /// authorized addresses are those who have the permision to match and complete a swap with funds 
  /// in a pool with specific index. For example, for an LP pool with index `i` there could be multiple
  /// addresses that `poolOfAuthorizedAddr[address] = i`, which means these addresses can all sign to match
  /// (call `bondSwap`, `lock`) a swap and complete it (call `release`) with funds in pool `i`. That helps
  /// an LP to give other addresses the permission to perform daily swap transactions. However, authorized
  /// addresses cannot withdraw funds from the LP pool, unless it's given in `ownerOfPool` which records
  /// the *owner* address for each pool.
  ///
  /// The pool index 0 is reserved for use by Meson
  mapping(address => uint40) public poolOfAuthorizedAddr;

  /// @notice The mapping from LP pool indexes to their owner addresses.
  /// Each LP pool in Meson has a uint40 index `i` and each LP needs to register an pool index at
  /// initial deposit by calling `depositAndRegister`. The balance for each LP pool is tracked by its
  /// pool index and token index (see `_balanceOfPoolToken`).
  /// 
  /// This mapping records the *owner* address for each LP pool. Only the owner address can withdraw funds
  /// from its corresponding LP pool.
  ///
  /// The pool index 0 is reserved for use by Meson
  mapping(uint40 => address) public ownerOfPool;

  /// @notice Balance for each token in LP pool, tracked by the `poolTokenIndex`.
  /// See `ownerOfPool` to understand how pool index is defined and used.
  ///
  /// The balance of a token in an LP pool is `_balanceOfPoolToken[poolTokenIndex]` in which
  /// the `poolTokenIndex` is in format of `tokenIndex:uint8|poolIndex:uint40`. `tokenIndex`
  /// is the index of supported tokens given by `tokenForIndex` (see definition in `MesonTokens.sol`).
  /// The balances are always store as tokens have decimal 6, which is the case for USDC/USDT on most chains
  /// except BNB Chain & Conflux. In the exceptional cases, the value of token amount will be converted
  /// on deposit and withdrawal (see `_safeTransfer` and `_unsafeDepositToken` in `MesonHelpers.sol`).
  ///
  /// The pool index 0 is reserved for use by Meson to store service fees
  mapping(uint48 => uint256) internal _balanceOfPoolToken;

  /// @dev This empty reserved space is put in place to allow future versions to
  /// add new variables without shifting down storage in the inheritance chain.
  /// See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
  uint256[50] private __gap;

  function poolTokenBalance(address token, address addr) external view returns (uint256) {
    uint8 tokenIndex = indexOfToken[token];
    uint40 poolIndex = poolOfAuthorizedAddr[addr];
    if (poolIndex == 0 || tokenIndex == 0) {
      return 0;
    }
    return _balanceOfPoolToken[_poolTokenIndexFrom(tokenIndex, poolIndex)];
  }
  
  /// @notice The collected service fee of a specific token.
  /// @param tokenIndex The index of a supported token. See `tokenForIndex` in `MesonTokens.sol`
  function serviceFeeCollected(uint8 tokenIndex) external view returns (uint256) {
    return _balanceOfPoolToken[_poolTokenIndexFrom(tokenIndex, 0)];
  }
}
