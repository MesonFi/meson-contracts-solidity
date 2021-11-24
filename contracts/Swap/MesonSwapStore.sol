// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/// @title MesonSwapStore
contract MesonSwapStore {
  struct SwapRequest {
    uint256 amount;
    uint256 metaAmount;
    address inToken;
    bytes4 chain;
    bytes outToken;
    bytes receiver; // could be an hex42 address (eth) or in other types
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
    bytes4 chain,
    bytes memory outToken,
    bytes memory receiver
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

  function _deleteRequest(bytes32 swapId) internal {
    delete requests[swapId];
  }
}
