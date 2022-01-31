// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @title MesonPools Interface
interface IMesonPoolsEvents {
  /// @notice Event when a swap request has been locked.
  /// Emit at the end of `lock()` calls.
  /// @param swapId The ID of the swap
  event SwapLocked(bytes32 swapId);

  /// @notice Event when a swap request has been released.
  /// Emit at the end of `release()` calls.
  /// @param swapId The ID of the swap
  event SwapReleased(bytes32 swapId);
}
