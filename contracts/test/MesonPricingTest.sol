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

  function getSwapId(
    uint256 metaAmount,
    address inToken,
    string memory chain,
    string memory outToken,
    string memory receiver
  ) public pure returns (bytes32) {
    return _getSwapId(
      metaAmount,
      inToken,
      chain,
      outToken,
      receiver
    );
  }

  /// @notice Get ID for a swap on the target chain the swap is requested
  function getSwapIdAsProvider(
    uint256 metaAmount,
    string memory inToken,
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
