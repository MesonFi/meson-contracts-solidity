// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.6;

import "../Pricing/MesonPricing.sol";

contract MesonPricingTest is MesonPricing {

  function increase(address token, uint256 amount) public {
    _increaseSupply(token, amount);
  }

  function decrease(address token, uint256 amount) public {
    _decreaseSupply(token, amount);
  }
}
