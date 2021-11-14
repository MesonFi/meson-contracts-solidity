// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../interfaces/IERC20Minimal.sol";

interface IMesonSwap {
  function requestSwap(
    uint256 amount,
    address inToken,
    string memory chain,
    string memory outToken,
    string memory receiver
  ) external returns (bytes32);

  function bondSwap(bytes32 swapId, address provider) external;

  function unbondSwap(bytes32 swapId) external;

  function executeSwap(
    bytes32 swapId,
    bytes memory signature,
    uint256 epoch
  ) external;

  function cancelSwap(bytes32 swapId) external;
}
