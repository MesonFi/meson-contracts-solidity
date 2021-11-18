// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @notice Parameters of the Meson contract
contract MesonConfig is OwnableUpgradeable {
  string constant CURRENT_CHAIN = "ETH";

  uint256 constant BOND_TIME_PERIOD = 1 hours;

  uint256 constant EPOCH_TIME_PERIOD = 1 hours;

  uint256 constant MAX_RELEASE_AMOUNT_BY_EPOCH = 1000000;

  uint256 constant TOTAL_DEMAND_CALC_PERIOD = 1 days;
}
