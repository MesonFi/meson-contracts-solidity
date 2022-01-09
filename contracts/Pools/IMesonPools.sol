// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @title MesonPools Interface
interface IMesonPools {
  struct LockingSwap {
    address initiator;
    address provider;
    address token;
    uint256 amount;
    address recipient;
    uint64 until;
  }

  /// @notice Deposit tokens into the liquidity pool. This is the
  /// prerequisite for LPs if they want to participate in swap
  /// trades.
  /// @dev Designed to be used by liquidity providers
  /// @param token The contract address of the depositing token
  /// @param amount The amount to be added to the pool
  function deposit(address token, uint256 amount) external;

  /// @notice Withdraw tokens from the liquidity pool. In order to make sure
  /// pending swaps can be satisfied, withdraw have a rate limit that
  /// in each epoch, total amounts to release (to users) and withdraw
  /// (to LP himself) cannot exceed MAX_RELEASE_AMOUNT_BY_EPOCH.
  /// This method will only run in the current epoch. Use `release`
  /// if wish to increment epoch.
  /// @dev Designed to be used by liquidity providers
  /// @param token The contract address of the withdrawing token
  /// @param amount The amount to be removed from the pool
  function withdraw(address token, uint256 amount) external;

  /// @notice Lock tokens
  function lock(
    bytes32 swapId,
    address initiator,
    uint256 amount,
    address token,
    address recipient
  ) external;

  /// @notice Unlock tokens
  function unlock(bytes32 swapId) external;

  /// @notice Release tokens to satisfy a user's swap request.
  /// This is step 3️⃣  in a swap.
  /// The LP should call this first before calling `executeSwap`.
  /// Otherwise, other people can use the signature to challenge the LP.
  /// For a single swap, signature given here is identical to the one used
  /// in `executeSwap`.
  /// @dev Designed to be used by liquidity providers
  /// @param swapId The ID of the swap
  /// @param metaAmount The meta-amount of token to swap (not the exact releasing amount)
  function release(
    bytes32 swapId,
    uint256 metaAmount,
    bytes32 domainHash,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) external;

  /// @notice If a LP calls `executeSwap` before `release`, anyone can
  /// call this to punish the LP.
  /// @dev Designed to be used by anyone
  function challenge() external;

  /// @notice Event when a swap request has been locked.
  /// Emit at the end of `lock()` calls.
  /// @param swapId The ID of the swap
  /// @param provider The address of the bonded provider
  event SwapLocked(bytes32 swapId, address provider);

  /// @notice Event when a swap request has been released.
  /// Emit at the end of `release()` calls.
  /// @param swapId The ID of the swap
  event SwapReleased(bytes32 swapId);
}
