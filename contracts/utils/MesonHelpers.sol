// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

// import "./IERC20Minimal.sol";
import "../MesonConfig.sol";

/// @title MesonHelpers
contract MesonHelpers is MesonConfig {
  bytes4 private constant ERC20_TRANSFER_SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));

  function _msgSender() internal view returns (address) {
    return msg.sender;
  }

  function _msgData() internal pure returns (bytes calldata) {
    return msg.data;
  }

  function getShortCoinType() external pure returns (bytes2) {
    return bytes2(SHORT_COIN_TYPE);
  }

  /// @notice Safe transfers tokens from msg.sender to a recipient
  /// for interacting with ERC20 tokens that do not consistently return true/false
  /// @param token The contract address of the token which will be transferred
  /// @param recipient The recipient of the transfer
  /// @param amount The value of the transfer
  function _safeTransfer(
    address token,
    address recipient,
    uint256 amount,
    bool isMSN
  ) internal {
    require(amount < 1e60, "Amount overflow");
    // IERC20Minimal(token).transfer(recipient, amount * 1e12);
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(
      bytes4(0xa9059cbb), // bytes4(keccak256(bytes("transfer(address,uint256)")))
      recipient,
      amount * 1e12
    ));
    require(success && (data.length == 0 || abi.decode(data, (bool))), "transfer failed");
  }

  /// @notice Execute the token transfer transaction
  function _unsafeDepositToken(
    address token,
    address sender,
    uint256 amount,
    bool isMSN
  ) internal {
    require(token != address(0), "Token not supported");
    require(amount > 0, "Amount must be greater than zero");
    require(amount < 1e60, "Amount overflow");
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(
      bytes4(0x23b872dd), // bytes4(keccak256(bytes("transferFrom(address,address,uint256)")))
      sender,
      address(this),
      amount * 1e12
    ));
    require(success && (data.length == 0 || abi.decode(data, (bool))), "transferFrom failed");
  }

  function _getSwapId(uint256 encodedSwap, address initiator) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(encodedSwap, initiator));
  }

  function _amountFrom(uint256 encodedSwap) internal pure returns (uint256) {
    return encodedSwap >> 208;
  }

  function _feeFrom(uint256 encodedSwap) internal pure returns (uint256) {
    return (encodedSwap >> 88) & 0xFFFFFFFFFF;
  }

  function _feeToMesonFrom(uint256 encodedSwap) internal pure returns (uint256) {
    return ((encodedSwap >> 90) & 0x3FFFFFFFFF); // 25% fee to meson
  }

  function _saltFrom(uint256 encodedSwap) internal pure returns (uint80) {
    return uint80(encodedSwap >> 128);
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

  function _outTokenBalanceIndexFrom(uint256 encodedSwap, uint40 providerIndex) internal pure returns (uint48) {
    return uint48((encodedSwap & 0xFF000000) << 16) | providerIndex;
  }

  function _initiatorFromPosted(uint200 postedSwap) internal pure returns (address) {
    return address(uint160(postedSwap >> 40));
  }

  function _providerIndexFromPosted(uint200 postedSwap) internal pure returns (uint40) {
    return uint40(postedSwap);
  }

  function _lockedSwapFrom(uint256 until, uint40 providerIndex) internal pure returns (uint80) {
    return (uint80(until) << 40) | providerIndex;
  }

  function _providerIndexFromLocked(uint80 lockedSwap) internal pure returns (uint40) {
    return uint40(lockedSwap);
  }

  function _untilFromLocked(uint80 lockedSwap) internal pure returns (uint256) {
    return uint256(lockedSwap >> 40);
  }

  function _balanceIndexFrom(uint8 tokenIndex, uint40 providerIndex) internal pure returns (uint48) {
    return (uint48(tokenIndex) << 40) | providerIndex;
  }

  function _tokenIndexFromBalanceIndex(uint48 balanceIndex) internal pure returns (uint8) {
    return uint8(balanceIndex >> 40);
  }

  function _providerIndexFromBalanceIndex(uint48 balanceIndex) internal pure returns (uint40) {
    return uint40(balanceIndex);
  }

  function _checkRequestSignature(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) internal pure {
    require(signer != address(0), "Signer cannot be empty address");

    if (_inChainFrom(encodedSwap) == 0x00c3) {
      bytes32 digest = keccak256(abi.encodePacked(
        bytes25(0x1954524f4e205369676e6564204d6573736167653a0a33320a), // HEX of "\x19TRON Signed Message:\n32\n"
        encodedSwap
      ));
      require(signer == ecrecover(digest, v, r, s), "Invalid signature");
      return;
    }

    bytes32 typehash = REQUEST_TYPE_HASH;
    bytes32 digest;
    assembly {
      mstore(0, encodedSwap)
      mstore(32, keccak256(0, 32))
      mstore(0, typehash)
      digest := keccak256(0, 64)
    }
    require(signer == ecrecover(digest, v, r, s), "Invalid signature");
  }

  function _checkReleaseSignature(
    uint256 encodedSwap,
    address recipient,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) internal pure {
    require(signer != address(0), "Signer cannot be empty address");

    if (_inChainFrom(encodedSwap) == 0x00c3) {
      bytes32 digest = keccak256(abi.encodePacked(
        bytes25(0x1954524f4e205369676e6564204d6573736167653a0a33320a), // HEX of "\x19TRON Signed Message:\n32\n"
        encodedSwap,
        recipient
      ));
      require(signer == ecrecover(digest, v, r, s), "Invalid signature");
      return;
    }

    bytes32 digest;
    if (_outChainFrom(encodedSwap) == 0x00c3) {
      assembly {
        mstore(21, recipient)
        mstore8(32, 0x41)
        mstore(0, encodedSwap)
        mstore(32, keccak256(0, 53))
        mstore(0, 0xcdd10eb72226dc70c96479571183c7d98ddba64dcc287980e7f6deceaad47c1c) // testnet
        // mstore(0, 0xf6ea10de668a877958d46ed7d53eaf47124fda9bee9423390a28c203556a2e55) // mainnet
        digest := keccak256(0, 64)
      }
    } else {
      bytes32 typehash = RELEASE_TYPE_HASH;
      assembly {
        mstore(20, recipient)
        mstore(0, encodedSwap)
        mstore(32, keccak256(0, 52))
        mstore(0, typehash)
        digest := keccak256(0, 64)
      }
    }
    require(signer == ecrecover(digest, v, r, s), "Invalid signature");
  }
}
