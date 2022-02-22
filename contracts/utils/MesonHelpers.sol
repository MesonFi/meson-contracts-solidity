// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

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
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(
      bytes4(0xa9059cbb), // bytes4(keccak256(bytes("transfer(address,uint256)")))
      recipient,
      amount
    ));
    require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
  }

  /// @notice Execute the token transfer transaction
  function _unsafeDepositToken(
    address token,
    address sender,
    uint256 amount
  ) internal {
    require(amount > 0, "Amount must be greater than zero");
    IERC20Minimal(token).transferFrom(sender, address(this), amount);
  }

  function _amountFrom(uint256 encodedSwap) internal pure returns (uint256) {
    return encodedSwap >> 160;
  }

  function _feeFrom(uint256 encodedSwap) internal pure returns (uint256) {
    return (encodedSwap >> 88) & 0xFFFFFFFFFF;
  }

  function _feeToMesonFrom(uint256 encodedSwap) internal pure returns (uint256) {
    return ((encodedSwap >> 89) & 0x7FFFFFFFFF); // 50% fee to meson
  }

  function _saltFrom(uint256 encodedSwap) internal pure returns (uint32) {
    return uint32(encodedSwap >> 128);
  }

  function _expireTsFrom(uint256 encodedSwap) internal pure returns (uint256) {
    return (encodedSwap >> 48) & 0xFFFFFFFFFF;
  }

  function _inChainFrom(uint256 encodedSwap) internal pure returns (uint16) {
    return uint16(encodedSwap >> 8);
  }

  function _inTokenIndexFrom(uint256 encodedSwap) internal pure returns (uint8) {
    return uint8(encodedSwap);
  }

  function _outChainFrom(uint256 encodedSwap) internal pure returns (uint16) {
    return uint16(encodedSwap >> 32);
  }

  function _outTokenIndexFrom(uint256 encodedSwap) internal pure returns (uint8) {
    return uint8(encodedSwap >> 24);
  }

  function _balanceIndexForMesonFrom(uint256 encodedSwap) internal pure returns (uint48) {
    return uint48(encodedSwap << 40);
  }

  function _outTokenBalanceIndexFrom(uint256 encodedSwap, uint48 providerIndex) internal pure returns (uint48) {
    return uint48((encodedSwap & 0xFF000000) << 16) | providerIndex;
  }

  function _initiatorFromPosted(uint200 postedSwap) internal pure returns (address) {
    return address(uint160(postedSwap >> 40));
  }

  function _providerIndexFromPosted(uint200 postedSwap) internal pure returns (uint40) {
    return uint40(postedSwap);
  }

  function _lockedSwapFrom(uint256 until, uint40 providerIndex, address initiator) internal pure returns (uint240) {
    return (uint240(until) << 200) | (uint240(providerIndex) << 160) | uint160(initiator);
  }

  function _initiatorFromLocked(uint240 lockedSwap) internal pure returns (address) {
    return address(uint160(lockedSwap));
  }

  function _providerIndexFromLocked(uint240 lockedSwap) internal pure returns (uint40) {
    return uint40(lockedSwap >> 160);
  }

  function _untilFromLocked(uint240 lockedSwap) internal pure returns (uint40) {
    return uint40(lockedSwap >> 200);
  }

  function _tokenIndexFromBalanceIndex(uint240 balanceIndex) internal pure returns (uint8) {
    return uint8(balanceIndex >> 40);
  }

  function _providerIndexFromBalanceIndex(uint48 balanceIndex) internal pure returns (uint40) {
    return uint40(balanceIndex);
  }

  function _balanceIndexFromTokenIndex(uint8 tokenIndex, uint40 providerIndex) internal pure returns (uint48) {
    return (uint48(tokenIndex) << 40) | providerIndex;
  }

  function _checkRequestSignature(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) internal pure {
    require(signer != address(0), "Signer cannot be empty address");
    bytes32 digest;
    assembly {
      mstore(0, encodedSwap)
      mstore(0x20, keccak256(0, 0x20))

      // The HEX string below is keccak256("bytes32 Sign to request a swap on Meson")
      mstore(0, 0x9862d877599564bcd97c37305a7b0fdbe621d9c2a125026f2ad601f754a75abc)
      digest := keccak256(0, 0x40)
    }
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
    bytes32 digest;
    assembly {
      mstore(0, encodedSwap)
      mstore(0x20, recipientHash)
      mstore(0x20, keccak256(0, 0x40))

      // The HEX string below is keccak256("bytes32 Sign to release a swap on Meson" + "bytes32 Recipient hash")
      mstore(0, 0x5ef297f2881340f11ed62c7c08e0e0c235c333ad8f340d7285f529f16716968a)
      digest := keccak256(0, 0x40)
    }
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
