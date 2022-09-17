// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

/// @title UCTUpgradeable
/// @notice The contract of UCT, a token minted by Meson for promotional events
/// UCT (USD Coupon Token) is issued by Meson team to mark participants for 
/// community events (such as airdrops, cashbacks, etc). UCT is not an asset 
/// and it has no value. UCT obtained directly from Meson during the event period 
/// can be redeemed for the actual USDT/USDC rewards on https://meson.fi/ at 
/// a ratio of 100:1. UCT has no usage other than redemption for USDT/USDC, 
/// and all UCTs will be destroyed at the end of the event.
contract UCTUpgradeable is UUPSUpgradeable, ERC20Upgradeable {
  address private _owner;
  address private _minter;
  address private _mesonContract;

  function initialize(address minter, address mesonContract) public initializer {
    __ERC20_init("USD Coupon Token (https://meson.fi)", "UCT");
    _owner = _msgSender();
    _minter = minter;
    require(mesonContract != address(0), "Address of meson contract cannot be zero");
    _mesonContract = mesonContract;
  }

  function decimals() public pure override returns (uint8) {
    return 4;
  }

  function batchMint(address[] memory targets, uint256 amount) external onlyMinter {
    require(targets.length > 0, "Target array is empty");
    require(targets.length < 2048, "Target array is too large");
    for (uint i = 0; i < targets.length; i++) {
      _mint(targets[i], amount);
    }
  }

  function batchMint2(address[] memory targets, uint256[] memory amounts) external onlyMinter {
    require(targets.length > 0, "Target array is empty");
    require(targets.length < 2048, "Target array is too large");
    require(targets.length == amounts.length, "Targets and amounts should have the same length");
    for (uint i = 0; i < targets.length; i++) {
      _mint(targets[i], amounts[i]);
    }
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
