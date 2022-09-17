// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/// @notice Parameters of the Meson contract
/// for CONFIG_BLOCKCHAIN_NAME
contract MesonConfig {
  uint8 constant MESON_PROTOCOL_VERSION = CONFIG_PROTOCOL_VERSION;

  // Ref https://github.com/satoshilabs/slips/blob/master/slip-0044.md
  uint16 constant SHORT_COIN_TYPE = CONFIG_COIN_TYPE;

  uint256 constant MAX_SWAP_AMOUNT = 1e11; // 100,000.000000 = 100k
  uint256 constant SERVICE_FEE_RATE = 10; // service fee = 10 / 10000 = 0.1%

  uint256 constant MIN_BOND_TIME_PERIOD = 1 hours;
  uint256 constant MAX_BOND_TIME_PERIOD = 2 hours;
  uint256 constant LOCK_TIME_PERIOD = CONFIG_LOCK_TIME;

  bytes28 constant ETH_SIGN_HEADER = bytes28("\x19Ethereum Signed Message:\n32");
  bytes28 constant ETH_SIGN_HEADER_52 = bytes28("\x19Ethereum Signed Message:\n52");
  bytes25 constant TRON_SIGN_HEADER = bytes25("\x19TRON Signed Message:\n32\n");
  bytes25 constant TRON_SIGN_HEADER_33 = bytes25("\x19TRON Signed Message:\n33\n");
  bytes25 constant TRON_SIGN_HEADER_53 = bytes25("\x19TRON Signed Message:\n53\n");

  bytes32 constant REQUEST_TYPE_HASH = keccak256("bytes32 Sign to request a swap on MesonCONFIG_TESTNET_MODE");
  bytes32 constant RELEASE_TYPE_HASH = keccak256("bytes32 Sign to release a swap on MesonCONFIG_TESTNET_MODEaddress Recipient");

  bytes32 constant RELEASE_TO_TRON_TYPE_HASH = keccak256("bytes32 Sign to release a swap on MesonCONFIG_TESTNET_MODEaddress Recipient (tron address in hex format)");
}
