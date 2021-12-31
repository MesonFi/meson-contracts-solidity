// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

// import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Parameters of the Meson contract
/// for CONFIG_BLOCKCHAIN_NAME
contract MesonConfig {
  // Ref https://github.com/satoshilabs/slips/blob/master/slip-0044.md
  bytes4 constant CURRENT_CHAIN = CONFIG_COIN_TYPE;

  uint256 constant BOND_TIME_PERIOD = 1 hours;

  uint256 constant TOTAL_DEMAND_CALC_PERIOD = 1 days;
}
