// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../interfaces/IERC20Minimal.sol";

/// @title MesonSwap Interface
interface IMesonSwap {
  struct SwapRequest {
    address initiator;
    uint256 packed;
    // uint32 providerIndex;
    // uint8 inTokenIndex;
    // uint128 total;
    // uint48 expireTs;
  }

  function requestSwap(bytes memory encodedSwap, uint8 inTokenIndex) external returns (bytes32 swapId);

  function bondSwap(bytes32 swapId) external;

  /// @notice A liquidity provider can call this method to post the swap and bond it
  /// to himself.
  /// This is step 1️⃣  in a swap.
  /// The bonding state will last BOND_TIME_PERIOD and at most one LP can be bonded.
  /// The bonding LP should call `release` and `executeSwap` in sequence
  /// to finish the swap within the bonding period.
  /// Otherwise, once the bonding period expired other LPs will
  /// be able to bond again, or the user can cancel the swap.
  /// @dev Designed to be used by liquidity providers
  /// @param encodedSwap The abi encoded swap
  /// @param initiator The address for the initiator of the swap
  function postSwap(
    bytes memory encodedSwap,
    address initiator,
    bytes32 r,
    bytes32 s,
    uint8 v,
    uint8 inTokenIndex
  ) external;

  /// @notice Cancel a swap
  /// @dev Designed to be used by users
  /// @param swapId The ID of the swap
  function cancelSwap(bytes32 swapId) external;

  /// @notice Execute the swap by providing a signature.
  /// This is step 4️⃣  in a swap.
  /// Once the signature is verified, the current bonding LP (provider)
  /// will receive tokens initially deposited by the user.
  /// The LP should call `release` first.
  /// For a single swap, signature given here is identical to the one used
  /// in `release`.
  /// Otherwise, other people can use the signature to `challenge` the LP.
  /// @dev Designed to be used by the current bonding LP
  /// @param swapId The ID of the swap
  function executeSwap(
    bytes32 swapId,
    bytes memory recipient,
    bytes32 r,
    bytes32 s,
    uint8 v,
    bool depositToPool
  ) external;

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
