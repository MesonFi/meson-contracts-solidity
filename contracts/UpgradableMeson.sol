// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./MesonManager.sol";

contract UpgradableMeson is UUPSUpgradeable, MesonManager {
  function initialize(address owner, address premiumManager) external initializer {
    _transferOwnership(owner);
    _transferPremiumManager(premiumManager);
  }

  function _authorizeUpgrade(address) internal override onlyOwner {}
}
