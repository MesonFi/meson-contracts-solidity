// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

// import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Parameters of the Meson contract
/// for CONFIG_BLOCKCHAIN_NAME
contract MesonConfig {
  // Ref https://github.com/satoshilabs/slips/blob/master/slip-0044.md
  uint16 constant SHORT_COIN_TYPE = CONFIG_COIN_TYPE;

  uint40 constant MIN_BOND_TIME_PERIOD = 1 hours;
  uint40 constant MAX_BOND_TIME_PERIOD = 2 hours;
  uint256 constant LOCK_TIME_PERIOD = 20 minutes;
}
