// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./MesonManager.sol";

/// @title Meson
/// @notice A plain non-upgradeable Meson
contract Meson is MesonManager {
  constructor(address premiumManager) {
    _transferOwnership(_msgSender());
    _transferPremiumManager(premiumManager);
  }
}
