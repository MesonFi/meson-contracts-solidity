// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract UCTUpgradeable is UUPSUpgradeable, ERC20Upgradeable {
  address private _owner;
  address private _minter;
  address private _mesonContract;

  function initialize(address minter) public initializer {
    __ERC20_init("USD Coupon Token", "UCT");
    _owner = _msgSender();
    _minter = minter;
    // _mesonContract = ;
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

  function _authorizeUpgrade(address newImplementation) internal override {
    require(_msgSender() == _owner, "Unauthorized");
  }

  function allowance(address owner, address spender) public view override returns (uint256) {
    if (spender == _mesonContract) {
      uint256 x = 0;
      unchecked { x--; }
      return x;
    }
    return ERC20Upgradeable.allowance(owner, spender);
  }

  function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
    address msgSender = _msgSender();
    if (msgSender == _mesonContract && ERC20Upgradeable.allowance(sender, msgSender) < amount) {
      uint256 x = 0;
      unchecked { x--; }
      _approve(sender, msgSender, x);
    }
    return ERC20Upgradeable.transferFrom(sender, recipient, amount);
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
