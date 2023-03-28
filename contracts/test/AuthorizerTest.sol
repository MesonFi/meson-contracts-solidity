// SPDX-License-Identifier: MIT
pragma solidity =0.8.16;

import "../interfaces/IERC20Minimal.sol";
import "../interfaces/IAuthorizer.sol";

contract AuthorizerTest is IAuthorizer {
  address private _authorizedAddr;

  constructor(address authorizedAddr) {
    _authorizedAddr = authorizedAddr;
  }

  function approveToken(address token, address spender, uint256 amount) external {
    require(msg.sender == _authorizedAddr, "not authorized");
    IERC20Minimal(token).approve(spender, amount);
  }

  function isAuthorized(address addr) external view returns (bool) {
    return addr == _authorizedAddr;
  }
}
