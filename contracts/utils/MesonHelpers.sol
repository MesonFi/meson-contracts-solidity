// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Strings.sol";

import "../MesonConfig.sol";
import "../interfaces/IERC20Minimal.sol";

/// @title MesonHelpers
contract MesonHelpers is MesonConfig {
  bytes4 private constant ERC20_TRANSFER_SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));

  /// @notice Safe transfers tokens from msg.sender to a recipient
  /// for interacting with ERC20 tokens that do not consistently return true/false
  /// @param token The contract address of the token which will be transferred
  /// @param recipient The recipient of the transfer
  /// @param amount The value of the transfer
  function _safeTransfer(
    address token,
    address recipient,
    uint256 amount
  ) internal {
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(ERC20_TRANSFER_SELECTOR, recipient, amount));
    require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
  }

  /// @notice Execute the token transfer transaction
  function _unsafeDepositToken(
    address token,
    address sender,
    uint256 amount
  ) internal {
    IERC20Minimal(token).transferFrom(sender, address(this), amount);
  }

  function _checkRequestSignature(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) internal view {
    require(signer != address(0), "Signer cannot be empty address");
    bytes32 digest = keccak256(abi.encodePacked(
      // next hash = keccak256(abi.encodePacked("string Notice", "bytes32 Encoded swap"))
      bytes32(0x1a76b359431334e60d4633af81b46702f12477315b8286fa908e623614d1d0bc),
      keccak256(abi.encodePacked("Sign to request a swap on Meson", encodedSwap))
    ));
    require(signer == ecrecover(digest, v, r, s), "Invalid signature");
  }

  function _checkReleaseSignature(
    uint256 encodedSwap,
    bytes32 recipientHash,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) internal pure {
    require(signer != address(0), "Signer cannot be empty address");
    bytes32 digest = keccak256(abi.encodePacked(
      // next hash = keccak256(abi.encodePacked("string Notice", "bytes32 Encoded swap", "bytes32 Recipient hash"))
      bytes32(0x7c9686b79d9ae79f496b739d7c6979a77cd378c673a58fd8c051d4f04427a9ab),
      keccak256(abi.encodePacked("Sign to release a swap on Meson", encodedSwap, recipientHash))
    ));
    require(signer == ecrecover(digest, v, r, s), "Invalid signature");
  }

  function getShortCoinType() external pure returns (bytes2) {
    return bytes2(SHORT_COIN_TYPE);
  }

  function _msgSender() internal view returns (address) {
    return msg.sender;
  }

  function _msgData() internal pure returns (bytes calldata) {
    return msg.data;
  }
}
