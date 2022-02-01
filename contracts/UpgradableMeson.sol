// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./Swap/MesonSwap.sol";
import "./Pools/MesonPools.sol";

contract UpgradableMeson is UUPSUpgradeable, MesonSwap, MesonPools {
  bool private _initialized;
  address private _owner;

  function initialize(address[] memory supportedTokens) public {
    require(!_initialized, "Contract instance has already been initialized");
    _initialized = true;

    _owner = _msgSender();

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

    for (uint8 i = 0; i < supportedTokens.length; i++) {
      _addSupportToken(supportedTokens[i], i + 1);
    }
  }

  function _authorizeUpgrade(address newImplementation) internal view override {
    require(_msgSender() == _owner, "unauthorized");
  }

  modifier onlyOwner() {
    require(_owner == _msgSender(), "Ownable: caller is not the owner");
    _;
  }
}
