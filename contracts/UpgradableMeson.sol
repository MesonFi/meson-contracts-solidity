// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./Swap/MesonSwap.sol";
import "./Pools/MesonPools.sol";

contract UpgradableMeson is UUPSUpgradeable, MesonSwap, MesonPools {
  bool private _initialized;
  address private _owner;
  address private _premiumManager;

  function initialize(address[] memory supportedTokens) public {
    require(!_initialized, "Contract instance has already been initialized");
    _initialized = true;
    _owner = _msgSender();
    _premiumManager = _msgSender();

    for (uint8 i = 0; i < supportedTokens.length; i++) {
      _addSupportToken(supportedTokens[i], i + 1);
    }
  }

  function _authorizeUpgrade(address newImplementation) internal override {
    require(_msgSender() == _owner, "Unauthorized");
  }

  function _onlyPremiumManager() internal view override {
    require(_premiumManager == _msgSender(), "Caller is not the premium manager");
  }

  modifier onlyOwner() {
    require(_owner == _msgSender(), "Caller is not the owner");
    _;
  }
}
