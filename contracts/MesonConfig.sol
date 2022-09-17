// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @notice Parameters of the Meson contract
/// for Ethereum Testnet
contract MesonConfig {
  // Ref https://github.com/satoshilabs/slips/blob/master/slip-0044.md
  uint16 constant SHORT_COIN_TYPE = 0x003c;

  uint256 constant MIN_BOND_TIME_PERIOD = 1 hours;
  uint256 constant MAX_BOND_TIME_PERIOD = 2 hours;
  uint256 constant LOCK_TIME_PERIOD = 40 minutes;

  // keccak256("bytes32 Sign to request a swap on Meson (Testnet)")
  bytes32 constant REQUEST_TYPE_HASH = 0x7b521e60f64ab56ff03ddfb26df49be54b20672b7acfffc1adeb256b554ccb25;
  
  // keccak256("bytes32 Sign to release a swap on Meson (Testnet)" + "bytes32 Recipient")
  bytes32 constant RELEASE_TYPE_HASH = 0xd23291d9d999318ac3ed13f43ac8003d6fbd69a4b532aeec9ffad516010a208c;
}
