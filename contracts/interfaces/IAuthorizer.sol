// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface IAuthorizer {
  function isAuthorized(address addr) external view returns (bool);
}
