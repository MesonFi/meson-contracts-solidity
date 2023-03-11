// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

/// @title PoDUpgradeable
/// @notice The contract of POD, a token minted by Meson as the Proof of Deposit
contract PoDUpgradeable is UUPSUpgradeable, ERC20Upgradeable {
  address private _owner;
  address private _minter;
  address private _mesonContract;

  function initialize(address minter, address mesonContract) public initializer {
    __ERC20_init("Proof of Deposit (meson.fi)", "PoD");
    _owner = _msgSender();
    _minter = minter;
    require(mesonContract != address(0), "Address of meson contract cannot be zero");
    _mesonContract = mesonContract;
  }

  function decimals() public pure override returns (uint8) {
    return 6;
  }

  function mint(address account, uint256 amount) external onlyMinter {
    _mint(account, amount);
  }

  function _authorizeUpgrade(address newImplementation) internal override {
    require(_msgSender() == _owner, "Unauthorized");
  }

  /// @notice Override the default ERC20 allowance method
  /// mesonContract will have max allowance so users don't need to execute approve
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
