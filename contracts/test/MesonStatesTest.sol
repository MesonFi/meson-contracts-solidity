// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../libraries/List.sol";
import "../utils/MesonHelpers.sol";
import "../utils/MesonStates.sol";

contract MesonStatesTest is MesonStates {
  using List for List.Bytes32List;

  constructor(address token) {
    _addTokenToSwapList(token);
  }

  function increaseSupply(address token, uint256 amount) public {
    _increaseSupply(token, amount);
  }

  function decreaseSupply(address token, uint256 amount) public {
    _decreaseSupply(token, amount);
  }

  function updateDemand(address token, uint256 metaAmount) public {
    _updateDemand(token, metaAmount);
  }

  function removeExpiredSwaps(address token) public {
    _removeExpiredSwaps(token);
  }

  function addRecentSwap(address token, bytes32 id, uint256 metaAmount, uint256 ts) public {
    Swap memory swap = Swap(id, metaAmount, ts);
    _recentSwaps[token][id] = swap;
    _recentSwapLists[token].addItem(id);
    _tokenDemand[token] = LowGasSafeMath.add(_tokenDemand[token], metaAmount);
  }

  function getRecentSwap(address token, bytes32 id) public view returns (Swap memory) {
    return _recentSwaps[token][id];
  }

  function getRecentSwapList(address token) public view returns (List.Bytes32List memory) {
    return _recentSwapLists[token];
  }
}
