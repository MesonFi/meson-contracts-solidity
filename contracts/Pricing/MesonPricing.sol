// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../libraries/LowGasSafeMath.sol";
import "../libraries/List.sol";

import "../MesonConfig.sol";

/// @title MesonPricing
/// @notice The class that keeps track of token supplies and swap requests,
/// and calculates the prices of tokens based on them.
contract MesonPricing is MesonConfig {
  using List for List.Bytes32List;

  struct Swap {
    bytes32 id;
    uint256 amount;
    uint256 ts;
  }

  mapping(address => bool) public supportedTokens;

  mapping(address => mapping(bytes32 => Swap)) private _swaps;
  mapping(address => List.Bytes32List) private _recentSwapLists;

  mapping(address => uint256) internal _tokenSupply;
  mapping(address => uint256) internal _tokenDemand;

  function _addTokenToSwapList (address token) internal {
    supportedTokens[token] = true;
    bytes32[] memory items;
    _recentSwapLists[token] = List.Bytes32List(0, 0, 0, items);
  }

  /// @notice convert from real token amount to meta amount
  function _toMetaAmount(address token, uint256 amount)
    internal
    returns (uint256 metaAmount)
  {
    _removeExpiredSwaps(token);
    uint256 supply = _tokenSupply[token];

    // TODO
    metaAmount = amount;
  }

  /// @notice convert from meta amount to real token amount
  function _fromMetaAmount(address token, uint256 metaAmount)
    internal
    returns (uint256 amount)
  {
    _removeExpiredSwaps(token);
    uint256 supply = _tokenSupply[token];

    // TODO
    amount = metaAmount;
  }

  /// @notice Get total supply for a given token
  function totalSupplyFor(address token) external view returns (uint256) {
    return _tokenSupply[token];
  }

  /// @notice Get total demand for a given token
  function totalDemandFor(address token) external view returns (uint256) {
    return _tokenSupply[token];
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
  function _updateDemand(address token, uint256 amount) internal {
    uint256 ts = block.timestamp;
    bytes32 id = keccak256(abi.encodePacked(ts, token, amount)); // TODO something else
    Swap memory swap = Swap(id, amount, ts);
    _swaps[token][id] = swap;
    _recentSwapLists[token].addItem(id);
    _tokenDemand[token] = LowGasSafeMath.add(_tokenDemand[token], amount);
  }

  /// @notice Remove expired swaps and update demand for a given token;
  /// swaps will not count to total demands after TOTAL_DEMAND_CALC_PERIOD
  function _removeExpiredSwaps(address token) private {
    uint256 current = block.timestamp;
    List.Bytes32List storage list = _recentSwapLists[token];

    (bool success, bytes32 id) = list.getTail();
    if (!success) return; // list is empty, ignore

    while (_swaps[token][id].ts + TOTAL_DEMAND_CALC_PERIOD < current) {
      _tokenDemand[token] = LowGasSafeMath.sub(
        _tokenDemand[token],
        _swaps[token][id].amount
      );
      list.popItem();
      delete _swaps[token][id];
      (success, id) = list.getTail();
    }
  }

  /// @notice Get Hash for a swap on the chain the swap is initiated
  function _getSwapHash(bytes32 swapId, uint256 epoch) internal pure returns (bytes32) {
      return keccak256(abi.encodePacked(swapId, ":", epoch));
  }

  /// @notice Get ID for a swap on the chain the swap is initiated
  function _getSwapId(
    uint256 metaAmount,
    address inToken,
    string memory chain,
    string memory outToken,
    string memory receiver
  ) internal pure returns (bytes32) {
    return _getSwapIdInternal(
      _addressToString(inToken),
      chain,
      outToken,
      receiver,
      metaAmount
    );
  }

  /// @notice Get ID for a swap on the target chain the swap is requested
  function _getSwapIdAsProvider(
    uint256 metaAmount,
    string memory inToken,
    address outToken,
    address receiver
  ) internal pure returns (bytes32) {
    return _getSwapIdInternal(
      inToken,
      CURRENT_CHAIN,
      _addressToString(outToken),
      _addressToString(receiver),
      metaAmount
    );
  }

  /// @notice Get ID for a swap on the chain the swap is initiated
  function _getSwapIdInternal(
    string memory inToken,
    string memory chain,
    string memory outToken,
    string memory receiver,
    uint256 metaAmount
  ) private pure returns (bytes32) {
    // TODO allow users to submit same swap request multiple times
    // like add nonce?
    return
      keccak256(
        abi.encodePacked(
          inToken,
          ":",
          chain,
          ":",
          outToken,
          ":",
          receiver,
          ":",
          metaAmount
        )
      );
  }

  function _addressToString(address addr) private pure returns (string memory) {
      bytes memory data = abi.encodePacked(addr);
      bytes memory alphabet = "0123456789abcdef";
      bytes memory str = new bytes(2 + data.length * 2);
      str[0] = "0";
      str[1] = "x";
      for (uint i = 0; i < data.length; i++) {
          str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
          str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
      }
      return string(str);
  }

  modifier tokenSupported(address token) {
    require(supportedTokens[token], "unsupported token");
    _;
  }
}
