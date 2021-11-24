// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./Swap/MesonSwap.sol";
import "./Pools/MesonPools.sol";

contract Meson is MesonSwap, MesonPools, UUPSUpgradeable {
  bool private initialized;

  function initialize(address _supportedToken) public {
    require(!initialized, "Contract instance has already been initialized");
    initialized = true;
    _addTokenToSwapList(_supportedToken);
  }

  function _authorizeUpgrade(address newImplementation) internal pure override {
    require(true, "unauthorized"); // TODO set authorizor
  }
}
