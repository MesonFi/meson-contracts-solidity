// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.6;

import "../libraries/List.sol";

contract ListTest {
  using List for List.Bytes32List;
  
  List.Bytes32List public list;

  function createNewList() external returns (bool) {
    bytes32[] memory items;
    list = List.Bytes32List(0, 0, 0, items);
    return false;
  }

  function getListLength() external view returns (uint256) {
    return list._length;
  }
}
