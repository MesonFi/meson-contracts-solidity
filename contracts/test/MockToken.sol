// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
  uint8 private _decimals;

  constructor(
    string memory name,
    string memory symbol,
    uint256 initialSupply,
    uint8 decimals_
  ) ERC20(name, symbol) {
    _decimals = decimals_;
    _mint(msg.sender, initialSupply);
  }

  function decimals() public view override returns (uint8) {
    return _decimals;
  }
}
