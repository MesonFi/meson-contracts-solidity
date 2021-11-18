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
    list._items.push(id);
    list._length = list._length + 1;
  }

  /// @notice Get the tail item of the list (but not remove it)
  /// @param list The list
  /// @return success false means the list is empty.
  /// @return item The tail item. Returns 0 if the list is empty.
  function getTail(Bytes32List storage list) internal view returns (bool success, bytes32 item) {
    if (list._length > 0) {
      item = list._items[list._tail];
      success = true;
    } else {
      item = 0;
      success = false;
    }
  }

  /// @notice Get the tail item and remove it
  /// @param list The list
  /// @return success false means the list is empty.
  /// @return item The tail item
  function popItem(Bytes32List storage list) internal returns (bool success, bytes32 item) {
    if (list._length == 0) {
      item = 0;
      success = false;
    } else {
      item = list._items[list._tail];
      list._tail = list._tail + 1;
      // TODO how to clear the memory?
      // delete list._items[list._tail];
      list._length = list._length - 1;
      success = true;
    }
  }
}
