// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @title MesonSwapStore
contract MesonSwapStore {
  struct SwapRequest {
    uint256 amount;
    uint256 metaAmount;
    address inToken;
    string chain;
    string outToken;
    string receiver; // could be an hex42 address (eth) or in other types
    address provider;
    uint256 bondUntil;
  }

  /// @notice swap requests by swapIds
  mapping(bytes32 => SwapRequest) public requests;

  function _newRequest(
    bytes32 swapId,
    uint256 amount,
    uint256 metaAmount,
    address inToken,
    string memory chain,
    string memory outToken,
    string memory receiver
  ) internal {
    requests[swapId] = SwapRequest({
      amount: amount,
      metaAmount: metaAmount,
      inToken: inToken,
      chain: chain,
      outToken: outToken,
      receiver: receiver,
      provider: address(0),
      bondUntil: 0
    });
  }
}
