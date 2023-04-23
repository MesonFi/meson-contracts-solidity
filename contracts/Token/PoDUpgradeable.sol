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

  mapping(address => uint256) private _lockedBalances;
  mapping(address => uint256) private _lockedSince;

  uint256 private _rewardRatePerSecTimes1e12;
  mapping(address => uint256) private _prevRewards;

  uint256 constant NO_REWARD_LOCK_PERIOD = 3 days;
  uint256 constant LESS_REWARD_LOCK_PERIOD = 7 days;

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

  function setRewardFactor(uint256 annualPercentageRateTimes1e4) external onlyOwner {
    _rewardRatePerSecTimes1e12 = annualPercentageRateTimes1e4 * 1e8 / 365 days;
  }

  function getCurrentAPR() public view returns (uint256) {
    return _rewardRatePerSecTimes1e12 * 365 days / 1e8;
  }

  function getLockedBalance(address account) public view returns (uint256) {
    return _lockedBalances[account];
  }
  
  function _getRewards(address account) internal view returns (uint256 total, uint256 pending) {
    uint256 lockedBalance = _lockedBalances[account];
    if (lockedBalance == 0) {
      return (_prevRewards[account], 0);
    }

    uint256 sinceLastLock = block.timestamp - _lockedSince[account];
    uint256 rewardsForCurrentLock = sinceLastLock * lockedBalance * _rewardRatePerSecTimes1e12 / 1e12;
    if (sinceLastLock > LESS_REWARD_LOCK_PERIOD) {
      return (_prevRewards[account] + rewardsForCurrentLock, 0);
    } else if (sinceLastLock > NO_REWARD_LOCK_PERIOD) {
      return (_prevRewards[account] + rewardsForCurrentLock, 3 days * lockedBalance * _rewardRatePerSecTimes1e12 / 1e12);
    } else {
      return (_prevRewards[account] + rewardsForCurrentLock, rewardsForCurrentLock);
    }
  }

  function getTotalRewards(address account) public view returns (uint256) {
    (uint256 total, ) = _getRewards(account);
    return total;
  }

  function getClaimableRewards(address account) public view returns (uint256) {
    (uint256 total, uint256 pending) = _getRewards(account);
    return total - pending;
  }

  function lockPoD(uint256 amount) external {
    require(amount > 0, "amount must be greater than 0");
    address account = _msgSender();

    (uint256 total, uint256 pending) = _getRewards(account);
    _prevRewards[account] = total - pending;

    uint256 newLockedBalance = _lockedBalances[account] + amount;
    _lockedSince[account] = block.timestamp - pending * 1e12 / _rewardRatePerSecTimes1e12 / newLockedBalance;
    _lockedBalances[account] = newLockedBalance;

    _transfer(account, address(this), amount);
  }

  function unlockPoD(uint256 amount) external {
    require(amount > 0, "amount must be greater than 0");
    address account = _msgSender();

    _prevRewards[account] = getClaimableRewards(account);

    uint256 newLockedBalance = _lockedBalances[account] - amount; // will throw error if overdrawn
    _lockedSince[account] = newLockedBalance > 0 ? block.timestamp : 0;
    _lockedBalances[account] = newLockedBalance;

    _transfer(address(this), account, amount);
  }

  function withdrawRewards(uint256 amount) external {
    require(amount > 0, "amount must be greater than 0");
    address account = _msgSender();

    uint256 claimableRewards = getClaimableRewards(account);
    require(amount <= claimableRewards, "Insufficient claimable rewards");

    _prevRewards[account] = claimableRewards - amount;
    if (_lockedSince[account] > 0) {
      _lockedSince[account] = block.timestamp;
    }

    _mint(account, amount);
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
