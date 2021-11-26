// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../libraries/LowGasSafeMath.sol";
import "../libraries/List.sol";

import "./MesonStates.sol";

/// @title MesonPricing
/// @notice The class that calculates the prices of tokens based on them.
contract MesonPricing is MesonStates {
  /// @notice convert from real token amount to meta amount
  function _toMetaAmount(address token, uint256 amount)
    internal
    returns (uint256 metaAmount)
  {
    _removeExpiredSwaps(token);
    // uint256 supply = _tokenSupply[token];
    // uint256 demand = _tokenDemand[token];

    // TODO
    metaAmount = amount;
  }

  /// @notice convert from meta amount to real token amount
  function _fromMetaAmount(address token, uint256 metaAmount)
    internal
    returns (uint256 amount)
  {
    _removeExpiredSwaps(token);
    // uint256 supply = _tokenSupply[token];
    // uint256 demand = _tokenDemand[token];

    // TODO
    amount = metaAmount;
  }
}
