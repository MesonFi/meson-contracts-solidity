// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

// import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Parameters of the Meson contract
contract MesonConfig {
  // Ref https://github.com/satoshilabs/slips/blob/master/slip-0044.md
  bytes4 constant CURRENT_CHAIN = 0x8000003c;

  uint256 constant BOND_TIME_PERIOD = 1 hours;

  uint256 constant EPOCH_TIME_PERIOD = 1 hours;

  uint256 constant MAX_RELEASE_AMOUNT_BY_EPOCH = 1000000;

  uint256 constant TOTAL_DEMAND_CALC_PERIOD = 1 days;
}
