// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./IDepositWithBeneficiary.sol";

interface IRecipientContract is IDepositWithBeneficiary {
  // methodId = 1
  function deposit(address token, uint256 amount, address beneficiary, uint16 data) external;
}
