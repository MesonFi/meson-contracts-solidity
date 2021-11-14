// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

library List {
  struct Bytes32List {
    uint256 _length;
    uint256 _tail;
    uint256 _head;
    bytes32[] _items;
  }

  function addItem(Bytes32List storage list, bytes32 id) public {
    require(list._tail < list._tail + 1, "list overflow");

    if (list._length == 0) {
      list._head = list._tail;
    } else {
      list._head = list._head + 1;
    }
    list._items[list._head] = id;
    list._length = list._length + 1;
  }

  function getTail(Bytes32List storage list) public view returns (bytes32) {
    require(list._length > 0, "list is empty");
    return list._items[list._tail];
  }

  function popItem(Bytes32List storage list) public returns (bytes32) {
    require(list._length > 0, "list is empty");

    bytes32 id = list._items[list._tail];
    list._tail = list._tail + 1;
    delete list._items[list._tail];
    list._length = list._length - 1;

    return id;
  }
}
