// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.6;

import "../Pricing/MesonPricing.sol";

contract MesonPricingTest is MesonPricing {
  constructor(address token) public {
    _addTokenToSwapList(token);
  }

  function increaseSupply(address token, uint256 amount) public {
    _increaseSupply(token, amount);
  }

  function decreaseSupply(address token, uint256 amount) public {
    _decreaseSupply(token, amount);
  }

  function getSwapHash(bytes32 swapId, uint256 epoch) public pure returns (bytes32) {
    return _getSwapHash(swapId, epoch);
  }

  function getSwapId(
    uint256 metaAmount,
    address inToken,
    bytes4 chain,
    bytes memory outToken,
    bytes memory receiver
  ) public pure returns (bytes32) {
    return _getSwapId(
      metaAmount,
      inToken,
      chain,
      outToken,
      receiver
    );
  }

  function getSwapIdAsProvider(
    uint256 metaAmount,
    bytes memory inToken,
    address outToken,
    address receiver
  ) public pure returns (bytes32) {
    return _getSwapIdAsProvider(
      metaAmount,
      inToken,
      outToken,
      receiver
    );
  }
}
