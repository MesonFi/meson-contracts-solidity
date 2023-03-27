// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/// @title Interface for depositWithBeneficiary
interface IDepositWithBeneficiary {
  /// @notice Make a token transfer that the *signer* is paying tokens but benefits are given to the *beneficiary*
  /// @param token The contract address of the transferring token
  /// @param amount The amount of the transfer
  /// @param beneficiary The address that will receive benefits of this transfer
  /// @param data Extra data passed to the contract
  /// @return Returns true for a successful transfer.
  function depositWithBeneficiary(address token, uint256 amount, address beneficiary, uint64 data) external returns (bool);
}
