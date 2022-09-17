// SPDX-License-Identifier: MIT
pragma solidity =0.8.16;

import "../Pools/MesonPools.sol";

contract MesonPoolsTest is MesonPools {
  address internal _premiumManager;

  constructor(address token, address premiumManager) {
    _addSupportToken(token, 1);
    _premiumManager = premiumManager;
  }

  function _onlyPremiumManager() internal view override {
    require(_premiumManager == _msgSender(), "Caller is not the premium manager");
  }
}
