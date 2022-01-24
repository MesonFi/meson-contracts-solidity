// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./Swap/MesonSwap.sol";
import "./Pools/MesonPools.sol";

contract UpgradableMeson is UUPSUpgradeable, MesonSwap, MesonPools ,OwnableUpgradeable{
  bool private initialized;

  function initialize(address[] memory _supportedTokens) public {
    require(!initialized, "Contract instance has already been initialized");
    initialized = true;
    DOMAIN_SEPARATOR =keccak256(abi.encode( EIP712_DOMAIN_TYPEHASH, keccak256(bytes("Meson Fi")),keccak256(bytes("1")), block.chainid,address(this)));

    for (uint i = 0; i < _supportedTokens.length; i++) {
      _addTokenToSwapList(_supportedTokens[i]);
    }
  }

  function _authorizeUpgrade(address newImplementation) internal pure override {
    require(true, "unauthorized"); // TODO set authorizor
  }

  function _msgSender() internal view virtual override (Context,ContextUpgradeable)  returns (address) {
        return msg.sender;
  }

  function _msgData() internal view virtual override (Context,ContextUpgradeable) returns (bytes calldata) {
        return msg.data;
  }
}
