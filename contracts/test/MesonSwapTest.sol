// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../Swap/MesonSwap.sol";

contract MesonSwapTest is MesonSwap {
  constructor(address token) {
    _addSupportToken(token, 1);
  }

  function register(uint40 providerIndex) external {
    address provider = _msgSender();
    require(providerIndex != 0, "Cannot use index 0");
    require(addressOfIndex[providerIndex] == address(0), "Index already registered");
    require(indexOfAddress[provider] == 0, "Address already registered");
    addressOfIndex[providerIndex] = provider;
    indexOfAddress[provider] = providerIndex;
  }
}
