// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @title MesonSwapEvents Interface
interface IMesonSwapEvents {
  /// @notice Event when a new swap is requested.
  /// Emit at the end of `requestSwap()` calls.
  /// @param encodedSwap Encoded swap
  event SwapRequested(uint256 encodedSwap);

  event SwapBonded(uint256 encodedSwap);

  /// @notice Event when a new swap request is posted.
  /// Emit at the end of `postSwap()` calls.
  /// @param encodedSwap Encoded swap
  event SwapPosted(uint256 encodedSwap);

  event SwapCancelled(uint256 encodedSwap);

  /// @notice Event when a swap request is fully executed.
  /// Emit at the end of `executeSwap()` calls.
  /// @param encodedSwap Encoded swap
  event SwapExecuted(uint256 encodedSwap);
}
