// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @title MesonSwapEvents Interface
interface IMesonSwapEvents {
  /// @notice Event when a swap request has been posted.
  /// Emit at the end of `postSwap()` calls.
  /// @param encodedSwap Encoded swap
  event SwapPosted(uint256 encodedSwap);

  /// @notice Event when a swap request has been bonded.
  /// Emit at the end of `bondSwap()` calls.
  /// @param encodedSwap Encoded swap
  event SwapBonded(uint256 encodedSwap);

  /// @notice Event when a swap request has been cancelled.
  /// Emit at the end of `cancelSwap()` calls.
  /// @param encodedSwap Encoded swap
  event SwapCancelled(uint256 encodedSwap);
}
