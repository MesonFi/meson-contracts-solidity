// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @title MesonPools Interface
interface IMesonPoolsEvents {
  /// @notice Event when a swap request has been locked.
  /// Emit at the end of `lock()` calls.
  /// @param encodedSwap Encoded swap
  event SwapLocked(uint256 encodedSwap);

  /// @notice Event when a swap request has been released.
  /// Emit at the end of `release()` calls.
  /// @param encodedSwap Encoded swap
  event SwapReleased(uint256 encodedSwap);
}
