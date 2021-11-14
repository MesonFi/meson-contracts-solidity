// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

interface IMesonPools {
  function deposit(address token, uint256 amount) external;

  function withdraw(address token, uint256 amount) external;

  function pause() external;

  function unpause() external;

  function release(
    address provider,
    bytes memory signature,
    uint256 metaAmount,
    string memory inToken,
    address outToken,
    address receiver,
    uint256 epoch
  ) external;

  function challenge(
    address provider,
    bytes memory signature,
    uint256 metaAmount,
    string memory inToken,
    address outToken,
    address receiver,
    uint256 epoch
  ) external;
}
