// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.6;

import "../libraries/List.sol";

contract ListTest {
  using List for List.Bytes32List;
  
  mapping(address => List.Bytes32List) public lists;

  function createNewList(address addr) external {
    bytes32[] memory items;
    lists[addr] = List.Bytes32List(0, 0, 0, items);
  }

  function getListLength(address addr) external view returns (uint256) {
    return lists[addr]._length;
  }

  function getListTail(address addr) external view returns (uint256) {
    return lists[addr]._tail;
  }

  function getListHead(address addr) external view returns (uint256) {
    return lists[addr]._head;
  }

  function getListItems(address addr) external view returns (bytes32[] memory) {
    return lists[addr]._items;
  }

  function addItem(address addr, bytes32 item) external {
    lists[addr].addItem(item);
  }

  function getTail(address addr) external returns (bytes32) {
    (bool success, bytes32 item) = lists[addr].getTail();
    if (!success) {
      return 0;
    }
    return item;
  }

  function popItem(address addr) external returns (bytes32) {
    (bool success, bytes32 item) = lists[addr].popItem();
    if (!success) {
      return 0;
    }
    return item;
  }
}
