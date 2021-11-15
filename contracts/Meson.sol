// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "./Swap/MesonSwap.sol";
import "./Pools/MesonPools.sol";

contract Meson is MesonSwap, MesonPools {
  address pricingContract;

  constructor(address pricingContract_) {
    pricingContract = pricingContract_;
  }
}
