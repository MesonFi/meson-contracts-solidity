// SPDX-License-Identifier: MIT
pragma solidity =0.8.16;

import "../Pools/MesonPools.sol";

contract MesonPoolsTest is MesonPools {
  address internal _premiumManager;

  constructor(address token, address premiumManager) {
    _addSupportToken(token, 1);
    _premiumManager = premiumManager;
  }

  function _isPremiumManager() internal view override returns (bool) {
    return _premiumManager == _msgSender();
  }
}
