// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./UpgradableMeson.sol";

contract ProxyToMeson is ERC1967Proxy {
  bytes4 private constant INITIALIZE_SELECTOR = bytes4(keccak256("initialize(address,address)"));

  constructor(address premiumManager) ERC1967Proxy(_deployImpl(), _encodeData(msg.sender, premiumManager)) {}

  function _deployImpl() private returns (address) {
    UpgradableMeson _impl = new UpgradableMeson();
    return address(_impl);
  }

  function _encodeData(address owner, address premiumManager) private pure returns (bytes memory) {
    return abi.encodeWithSelector(INITIALIZE_SELECTOR, owner, premiumManager);
  }
}
