// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @title MesonSwapEvents Interface
interface IMesonSwapEvents {
  /// @notice Event when a new swap is requested.
  /// Emit at the end of `requestSwap()` calls.
  /// @param swapId The ID of the swap
  event SwapRequested(bytes32 swapId);

  event SwapBonded(bytes32 swapId);

  /// @notice Event when a new swap request is posted.
  /// Emit at the end of `postSwap()` calls.
  /// @param swapId The ID of the swap
  event SwapPosted(bytes32 swapId);

  event SwapCancelled(bytes32 swapId);

  /// @notice Event when a swap request is fully executed.
  /// Emit at the end of `executeSwap()` calls.
  /// @param swapId The ID of the swap
  event SwapExecuted(bytes32 swapId);
}
