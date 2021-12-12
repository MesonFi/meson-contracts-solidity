// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../libraries/LowGasSafeMath.sol";
import "../libraries/List.sol";

import "./MesonHelpers.sol";

/// @title MesonStates
/// @notice The class that keeps track of token supplies and swap requests,
contract MesonStates is MesonHelpers {
  using List for List.Bytes32List;

  mapping(address => bool) public supportedTokens;

  mapping(address => mapping(bytes32 => Swap)) internal _recentSwaps;
  mapping(address => List.Bytes32List) internal _recentSwapLists;

  mapping(address => uint256) internal _tokenSupply;
  mapping(address => uint256) internal _tokenDemand;

  function _addTokenToSwapList(address token) internal {
    supportedTokens[token] = true;
    bytes32[] memory items;
    _recentSwapLists[token] = List.Bytes32List(0, 0, 0, items);
  }

  modifier tokenSupported(address token) {
    require(supportedTokens[token], "unsupported token");
    _;
  }

  /// @notice Get total supply for a given token
  function totalSupplyFor(address token) external view returns (uint256) {
    return _tokenSupply[token];
  }

  /// @notice Get total demand for a given token
  function totalDemandFor(address token) external view returns (uint256) {
    return _tokenDemand[token];
  }

  /// @notice Increase supply for a given token; will be called when
  /// a liquidity provider add tokens to the pool
  function _increaseSupply(address token, uint256 amount) internal {
    _tokenSupply[token] = LowGasSafeMath.add(_tokenSupply[token], amount);
  }

  /// @notice Decrease supply for a given token; will be called when
  /// a liquidity provider withdraw tokens from the pool or a swap
  /// is released
  function _decreaseSupply(address token, uint256 amount) internal {
    require(_tokenSupply[token] >= amount, "overdrawn");
    _tokenSupply[token] = LowGasSafeMath.sub(_tokenSupply[token], amount);
  }

  /// @notice Update demand for a given token; will be called when
  /// a swap is released
  function _updateDemand(address token, uint256 metaAmount) internal {
    uint256 ts = block.timestamp;
    bytes32 id = keccak256(abi.encodePacked(ts, token, metaAmount)); // TODO something else
    Swap memory swap = Swap(id, metaAmount, ts);
    _recentSwaps[token][id] = swap;
    _recentSwapLists[token].addItem(id);
    _tokenDemand[token] = LowGasSafeMath.add(_tokenDemand[token], metaAmount);
  }

  /// @notice Remove expired swaps and update demand for a given token;
  /// swaps will not count to total demands after TOTAL_DEMAND_CALC_PERIOD
  function _removeExpiredSwaps(address token) internal {
    uint256 current = block.timestamp;
    List.Bytes32List storage list = _recentSwapLists[token];

    (bool success, bytes32 id) = list.getTail();
    while (success && (_recentSwaps[token][id].ts + TOTAL_DEMAND_CALC_PERIOD < current)) {
      _tokenDemand[token] = LowGasSafeMath.sub(
        _tokenDemand[token],
        _recentSwaps[token][id].metaAmount
      );
      list.popItem();
      delete _recentSwaps[token][id];
      (success, id) = list.getTail();
    }
  }
}
