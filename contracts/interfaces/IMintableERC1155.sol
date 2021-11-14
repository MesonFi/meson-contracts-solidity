// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IMintableERC1155 is IERC1155 {
  function mint(uint256 id, uint256 amount, bytes memory data) external;
}
