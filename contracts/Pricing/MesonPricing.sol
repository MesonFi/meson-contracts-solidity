// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Strings.sol";

import "../libraries/LowGasSafeMath.sol";
import "../libraries/List.sol";

import "../MesonConfig.sol";

contract MesonPricing is MesonConfig {
  using List for List.Bytes32List;

  struct Swap {
    bytes32 id;
    uint256 amount;
    uint256 ts;
  }

  mapping(address => mapping(bytes32 => Swap)) private _swaps;
  mapping(address => List.Bytes32List) private _recentSwapLists;

  mapping(address => uint256) internal _tokenSupply;
  mapping(address => uint256) internal _tokenDemand;

  function _toMetaAmount(address token, uint256 amount)
    internal
    returns (uint256 metaAmount)
  {
    _removeExpiredSwaps(token);
    uint256 supply = _tokenSupply[token];

    // TODO
    metaAmount = amount;
  }

  function _fromMetaAmount(address token, uint256 metaAmount)
    internal
    returns (uint256 amount)
  {
    _removeExpiredSwaps(token);
    uint256 supply = _tokenSupply[token];

    // TODO
    amount = metaAmount;
  }

  function totalSupplyFor(address token) external view returns (uint256) {
    return _tokenSupply[token];
  }

  function totalDemandFor(address token) external view returns (uint256) {
    return _tokenSupply[token];
  }

  function _increaseSupply(address token, uint256 amount) internal {
    _tokenSupply[token] = LowGasSafeMath.add(_tokenSupply[token], amount);
  }

  function _decreaseSupply(address token, uint256 amount) internal {
    require(_tokenSupply[token] > amount, "overdrawn");
    _tokenSupply[token] = LowGasSafeMath.sub(_tokenSupply[token], amount);
  }

  function _updateDemand(address token, uint256 amount) internal {
    uint256 ts = block.timestamp;
    bytes32 id = keccak256(abi.encodePacked(ts, token, amount)); // TODO something else
    Swap memory swap = Swap(id, amount, ts);
    _swaps[token][id] = swap;
    _recentSwapLists[token].addItem(id);
    _tokenDemand[token] = LowGasSafeMath.add(_tokenDemand[token], amount);
  }

  function _removeExpiredSwaps(address token) private {
    uint256 current = block.timestamp;
    List.Bytes32List storage list = _recentSwapLists[token];

    bytes32 id = list.getTail();
    while (_swaps[token][id].ts + TOTAL_DEMAND_CALC_PERIOD < current) {
      _tokenDemand[token] = LowGasSafeMath.sub(
        _tokenDemand[token],
        _swaps[token][id].amount
      );
      list.popItem();
      delete _swaps[token][id];
      id = list.getTail();
    }
  }

  function _getSwapId(
    uint256 metaAmount,
    address inToken,
    string memory chain,
    string memory outToken,
    string memory receiver
  ) internal pure returns (bytes32) {
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
          Strings.toString(metaAmount)
        )
      );
  }

  function _getSwapIdAsProvider(
    uint256 metaAmount,
    string memory inToken,
    address outToken,
    address receiver
  ) internal pure returns (bytes32) {
    // TODO allow users to submit same swap request multiple times
    // like add nonce?
    return
      keccak256(
        abi.encodePacked(
          inToken,
          ":",
          CURRENT_CHAIN,
          ":",
          outToken,
          ":",
          receiver,
          ":",
          Strings.toString(metaAmount)
        )
      );
  }

  modifier tokenSupported(address token) {
    require(true, "unsupported token");
    _;
  }
}
