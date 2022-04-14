// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract MesonTokenUpgradeable is UUPSUpgradeable, ERC20Upgradeable {
  address private _owner;
  address private _minter;

  function initialize(address minter) public initializer {
    __ERC20_init("Meson Token", "MSN");
    _owner = _msgSender();
    _minter = minter;
  }

  function decimals() public pure override returns (uint8) {
    return 4;
  }

  function batchMint(address[] memory targets, uint256 amount) external onlyMinter {
    require(targets.length > 0, "Target array is empty");
    require(targets.length < 1024, "Target array is too large");
    for (uint i = 0; i < targets.length; i++) {
      _mint(targets[i], amount);
    }
  }

  function _authorizeUpgrade(address newImplementation) internal view override {
    require(_msgSender() == _owner, "Unauthorized");
  }

  modifier onlyOwner() {
    require(_owner == _msgSender(), "Caller is not the owner");
    _;
  }

  modifier onlyMinter() {
    require(_minter == _msgSender(), "Caller is not the owner");
    _;
  }
}
