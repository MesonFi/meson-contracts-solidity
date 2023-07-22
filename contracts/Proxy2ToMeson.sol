// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./UpgradableMeson.sol";

// Some blockchains do not support deploying another contract in constructor
contract Proxy2ToMeson is ERC1967Proxy {
  bytes4 private constant INITIALIZE_SELECTOR = bytes4(keccak256("initialize(address,address)"));

  constructor(address implAddress, address premiumManager) ERC1967Proxy(implAddress, _encodeData(msg.sender, premiumManager)) {}

  function _encodeData(address owner, address premiumManager) private pure returns (bytes memory) {
    return abi.encodeWithSelector(INITIALIZE_SELECTOR, owner, premiumManager);
  }
}
