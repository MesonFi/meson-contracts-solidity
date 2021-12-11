// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./Swap/MesonSwap.sol";
import "./Pools/MesonPools.sol";

contract UpgradableMeson is UUPSUpgradeable, MesonSwap, MesonPools {
  bool private initialized;

  function initialize(address[] memory _supportedTokens) public {
    require(!initialized, "Contract instance has already been initialized");
    initialized = true;
    for (uint i = 0; i < _supportedTokens.length; i++) {
      _addTokenToSwapList(_supportedTokens[i]);
    }
  }

  function _authorizeUpgrade(address newImplementation) internal pure override {
    require(true, "unauthorized"); // TODO set authorizor
  }
}
