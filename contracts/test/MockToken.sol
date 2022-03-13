// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
  uint8 private _decimals;

  constructor(
    string memory name,
    string memory symbol,
    uint256 initialSupply,
    uint8 decimals
  ) ERC20(name, symbol) {
    _decimals = decimals;
    _mint(msg.sender, initialSupply);
  }

  function decimals() public view override returns (uint8) {
    return _decimals;
  }
}
