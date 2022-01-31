// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../Swap/MesonSwap.sol";

contract MesonSwapTest is MesonSwap {
  constructor(address token) {
    DOMAIN_SEPARATOR =
      keccak256(
        abi.encode(
          EIP712_DOMAIN_TYPEHASH,
          keccak256(bytes("Meson Fi")),
          keccak256(bytes("1")),
          block.chainid,
          address(this)
        )
      );
    _addSupportToken(token, 0);
  }

  function register(uint40 providerIndex) external {
    address provider = _msgSender();
    require(providerIndex != 0, "Cannot use index 0");
    require(addressOfIndex[providerIndex] == address(0), "Index already registered");
    require(indexOfAddress[provider] == 0, "Address already registered");
    addressOfIndex[providerIndex] = provider;
    indexOfAddress[provider] = providerIndex;
  }

  function hasSwap(bytes32 swapId) external view returns (bool) {
    return _swapRequests[swapId] != 0;
  }
}
