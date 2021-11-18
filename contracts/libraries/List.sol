// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

/// @title A implementation of a first-in-first-out list
/// @notice The list items are bytes32
/// @dev The pool interface is broken up into many smaller pieces
library List {
  struct Bytes32List {
    uint256 _length;
    uint256 _tail;
    uint256 _head;
    bytes32[] _items;
  }

  /// @notice Add a new item to the list
  /// @param list The list
  /// @param id The item to add
  function addItem(Bytes32List storage list, bytes32 id) internal {
    require(list._tail < list._tail + 1, "list overflow");

    if (list._length == 0) {
      list._head = list._tail;
    } else {
      list._head = list._head + 1;
    }
    list._items[list._head] = id;
    list._length = list._length + 1;
  }

  /// @notice Get the tail item of the list (but not remove it)
  /// @param list The list
  /// @return item The tail item. Returns 0 if the list is empty.
  function getTail(Bytes32List storage list) internal view returns (bytes32) {
    if (list._length > 0) {
      return list._items[list._tail];
    } else {
      return 0;
    }
  }

  /// @notice Get the tail item and remove it
  /// @param list The list
  /// @return item The tail item
  function popItem(Bytes32List storage list) internal returns (bytes32) {
    require(list._length > 0, "list is empty");

    bytes32 id = list._items[list._tail];
    list._tail = list._tail + 1;
    delete list._items[list._tail];
    list._length = list._length - 1;

    return id;
  }
}
