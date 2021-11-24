// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../interfaces/IERC20Minimal.sol";

/// @title MesonSwap Interface
interface IMesonSwap {
  /// @notice Create a new swap request. This is step 1️⃣  in a swap.
  /// @dev Designed to be used by users
  /// @param amount The contract address of either token0 or token1
  /// @param inToken The contract address of the given token
  /// @param chain The target chain name
  /// @param outToken The type of token
  /// @param receiver The address of the output token
  /// @return swapId The ID of the swap
  function requestSwap(
    uint256 amount,
    address inToken,
    bytes4 chain,
    bytes memory outToken,
    bytes memory receiver
  ) external returns (bytes32);


  /// @notice A liquidity provider can call this method to bond the swap to himself.
  /// This is step 2️⃣  in a swap.
  /// The bonding state will last BOND_TIME_PERIOD and at most one LP can be bonded.
  /// The bonding LP should call `release` and `executeSwap` in sequence
  /// to finish the swap within the bonding period.
  /// Otherwise, once the bonding period expired other LPs will
  /// be able to bond again, or the user can cancel the swap.
  /// @dev Designed to be used by liquidity providers
  /// @param swapId The ID of the swap
  /// @param provider The address of the LP; will receives user's tokens on execution
  function bondSwap(bytes32 swapId, address provider) external;


  /// @notice Unbond a swap
  /// @dev Designed to be used by users
  /// @param swapId The ID of the swap
  function unbondSwap(bytes32 swapId) external;


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
  /// @param signature A signature that will unlock the swaps atomically on both chains
  /// @param epoch The epoch (ref. xxx)
  function executeSwap(
    bytes32 swapId,
    bytes memory signature,
    uint256 epoch
  ) external;


  /// @notice Cancel a swap
  /// @dev Designed to be used by users
  /// @param swapId The ID of the swap
  function cancelSwap(bytes32 swapId) external;

  /// @notice Event when a new swap request has been posted.
  /// Emit at the end of `requestSwap()` calls.
  /// @param swapId The ID of the swap
  /// @param amount The contract address of either token0 or token1
  /// @param inToken The contract address of the given token
  /// @param chain The target chain name
  /// @param outToken The type of token
  /// @param receiver The address of the output token
  event RequestPosted(
      bytes32 swapId,
      uint256 amount,
      address inToken,
      bytes4 chain,
      bytes outToken,
      bytes receiver
  );

  /// @notice Event when a swap request has been bonded.
  /// Emit at the end of `bondSwap()` calls.
  /// @param swapId The ID of the swap
  /// @param bondedProvider The address of the bonded provider
  event RequestBonded(bytes32 swapId, address bondedProvider);

  /// @notice Event when a swap request has been fully executed.
  /// Emit at the end of `executeSwap()` calls.
  /// @param swapId The ID of the swap
  event RequestExecuted(bytes32 swapId);
}
