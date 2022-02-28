// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @notice Parameters of the Meson contract
/// for CONFIG_BLOCKCHAIN_NAME
contract MesonConfig {
  // Ref https://github.com/satoshilabs/slips/blob/master/slip-0044.md
  uint16 constant SHORT_COIN_TYPE = CONFIG_COIN_TYPE;

  uint256 constant MIN_BOND_TIME_PERIOD = 1 hours;
  uint256 constant MAX_BOND_TIME_PERIOD = 2 hours;
  uint256 constant LOCK_TIME_PERIOD = 20 minutes;

  // keccak256("bytes32 Sign to request a swap on MesonCONFIG_TESTNET_MODE")
  bytes32 constant REQUEST_TYPE_HASH = CONFIG_REQUEST_TYPE_HASH;
  
  // keccak256("bytes32 Sign to release a swap on MesonCONFIG_TESTNET_MODE" + "bytes32 Recipient hash")
  bytes32 constant RELEASE_TYPE_HASH = CONFIG_REQUEST_TYPE_HASH;
}
