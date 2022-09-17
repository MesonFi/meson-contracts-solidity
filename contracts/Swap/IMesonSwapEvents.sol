// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/// @title MesonSwapEvents Interface
interface IMesonSwapEvents {
  /// @notice Event when a swap request was posted.
  /// Emit at the end of `postSwap()` calls.
  /// @param encodedSwap Encoded swap
  event SwapPosted(uint256 indexed encodedSwap);

  /// @notice Event when a swap request was bonded.
  /// Emit at the end of `bondSwap()` calls.
  /// @param encodedSwap Encoded swap
  event SwapBonded(uint256 indexed encodedSwap);

  /// @notice Event when a swap request was cancelled.
  /// Emit at the end of `cancelSwap()` calls.
  /// @param encodedSwap Encoded swap
  event SwapCancelled(uint256 indexed encodedSwap);
}
