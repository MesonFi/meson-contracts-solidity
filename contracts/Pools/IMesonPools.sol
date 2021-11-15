// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @title MesonPools Interface
/// @notice xx
interface IMesonPools {
  /// @notice Deposit into the liquidity pool
  /// @dev Designed to be used by liquidity providers
  /// @param token The contract address of the depositing token
  /// @param amount The amount to be added to the pool
  function deposit(address token, uint256 amount) external;


  /// @notice Withdraw from the liquidity pool
  /// @dev Designed to be used by liquidity providers
  /// @param token The contract address of the withdrawing token
  /// @param amount The amount to be removed from the pool
  function withdraw(address token, uint256 amount) external;


  /// @notice TBD
  function pause() external;


  /// @notice TBD
  function unpause() external;


  /// @notice Release tokens to satisfy a user's swap request.
  /// The LP should call this first before calling `executeSwap`.
  /// Otherwise, other people can use the signature to challenge the LP.
  /// @dev Designed to be used by liquidity providers
  /// @param provider The address of the liquidity provider
  /// @param signature A signature that will unlock the swaps atomically on both chains
  /// @param metaAmount The meta-amount of token to swap (not the exact releasing amount)
  /// @param inToken The input token deposited by the user
  /// @param outToken The output token the user wish to withdraw
  /// @param receiver The address that will receive the output token
  /// @param epoch The epoch (ref. xxx)
  function release(
    address provider,
    bytes memory signature,
    uint256 metaAmount,
    string memory inToken,
    address outToken,
    address receiver,
    uint256 epoch
  ) external;


  /// @notice If a LP calls `executeSwap` before `release`, anyone can
  /// call this to punish the LP.
  /// @dev Designed to be used by anyone
  /// @param provider The address of the liquidity provider
  /// @param signature A signature that will unlock the swaps atomically on both chains
  /// @param metaAmount The meta-amount of token to swap (not the exact releasing amount)
  /// @param inToken The input token deposited by the user
  /// @param outToken The output token the user wish to withdraw
  /// @param receiver The address that will receive the output token
  /// @param epoch The epoch (ref. xxx)
  function challenge(
    address provider,
    bytes memory signature,
    uint256 metaAmount,
    string memory inToken,
    address outToken,
    address receiver,
    uint256 epoch
  ) external;
}
