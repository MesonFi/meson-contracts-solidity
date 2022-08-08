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
  /// TODO: define isUCT here
  function _safeTransfer(
    address token,
    address recipient,
    uint256 amount,
    bool isUCT
  ) internal {
    // IERC20Minimal(token).transfer(recipient, amount);
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(
      bytes4(0xa9059cbb), // bytes4(keccak256(bytes("transfer(address,uint256)")))
      recipient,
      amount
    ));
    require(success && (data.length == 0 || abi.decode(data, (bool))), "transfer failed");
  }

  /// @notice Execute the token transfer transaction
  /// TODO: add complete descriptions
  /// @param amount Means the token is UCT which is minted by Meson and can be swapped to USDC or USDT at 100:1 ratio.
  /// TODO: add all params
  /// TODO: define isUCT here
  function _unsafeDepositToken(
    address token,
    address sender,
    uint256 amount,
    bool isUCT
  ) internal {
    require(token != address(0), "Token not supported");
    require(amount > 0, "Amount must be greater than zero");
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(
      bytes4(0x23b872dd), // bytes4(keccak256(bytes("transferFrom(address,address,uint256)")))
      sender,
      address(this),
      amount
    ));
    require(success && (data.length == 0 || abi.decode(data, (bool))), "transferFrom failed");
  }

  /// @notice `swapId` is the mapping key of `_lockedSwaps` in '../Pools/MesonPools.sol'.
  function _getSwapId(uint256 encodedSwap, address initiator) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(encodedSwap, initiator));
  }
  
  /// TODO: describe non-typed signing
  function _signNonTyped(uint256 encodedSwap) internal pure returns (bool) {
    return (encodedSwap & 0x0800000000000000000000000000000000000000000000000000) > 0;
  }

  /// TODO: describe fee waived swap (similar to other comments)
  function _feeWaived(uint256 encodedSwap) internal pure returns (bool) {
    return (encodedSwap & 0x4000000000000000000000000000000000000000000000000000) > 0;
  }

  /// TODO: ref to `MesonSwaps.sol` for definition of `encodedSwap`; give a short description
  function _amountFrom(uint256 encodedSwap) internal pure returns (uint256) {
    return encodedSwap >> 208;
  }

  /// TODO: ref to `MesonSwaps.sol` for definition of `encodedSwap`; give a short description
  function _serviceFee(uint256 encodedSwap) internal pure returns (uint256) {
    return _amountFrom(encodedSwap) / 1000; // Default to `serviceFee` = 0.1% * `amount`
  }
  /// [Suggestion]: mutable service fee points rate
    // uint public feePointsRate = 10;
    // modifier onlyOwner() {...}
    // function setFeePoints(uint newFeePoints) onlyOwner external {...}
    // function _serviceFee(uint256 encodedSwap) internal pure returns (uint256) {
    //   return uint256(encodedSwap >> 208) * feePointsRate / 10000;
    // }

  /// TODO: ref to `MesonSwaps.sol` for definition of `encodedSwap`; give a short description
  function _feeForLp(uint256 encodedSwap) internal pure returns (uint256) {
    return (encodedSwap >> 88) & 0xFFFFFFFFFF;
  }

  /// TODO: ref to `MesonSwaps.sol` for definition of `encodedSwap`; give a short description
  function _saltFrom(uint256 encodedSwap) internal pure returns (uint80) {
    return uint80(encodedSwap >> 128);
  }

  /// TODO: ref to `MesonSwaps.sol` for definition of `encodedSwap`; give a short description
  function _expireTsFrom(uint256 encodedSwap) internal pure returns (uint256) {
    return (encodedSwap >> 48) & 0xFFFFFFFFFF;
    // [Suggestion]: return uint40(encodedSwap >> 48);
  }

  /// TODO: ref to `MesonSwaps.sol` for definition of `encodedSwap`; give a short description
  function _inChainFrom(uint256 encodedSwap) internal pure returns (uint16) {
    return uint16(encodedSwap >> 8);
  }

  /// TODO: ref to `MesonSwaps.sol` for definition of `encodedSwap`; give a short description
  function _inTokenIndexFrom(uint256 encodedSwap) internal pure returns (uint8) {
    return uint8(encodedSwap);
  }

  /// TODO: ref to `MesonSwaps.sol` for definition of `encodedSwap`; give a short description
  function _outChainFrom(uint256 encodedSwap) internal pure returns (uint16) {
    return uint16(encodedSwap >> 32);
  }

  /// TODO: ref to `MesonSwaps.sol` for definition of `encodedSwap`; give a short description
  function _outTokenIndexFrom(uint256 encodedSwap) internal pure returns (uint8) {
    return uint8(encodedSwap >> 24);
  }

  /// TODO: ref to `MesonSwaps.sol` for definition of `encodedSwap`; give a short description
  function _poolTokenIndexForOutToken(uint256 encodedSwap, uint40 poolIndex) internal pure returns (uint48) {
    return uint48((encodedSwap & 0xFF000000) << 16) | poolIndex;
  }

  /// @notice Decode `initiator` from `postedSwap`
  /// TODO: refer to places where `initiator` and `postedSwap` are defined
  function _initiatorFromPosted(uint200 postedSwap) internal pure returns (address) {
    return address(uint160(postedSwap >> 40));
  }

  /// @notice Decode `poolIndex` from `postedSwap`
  /// TODO: refer to places where `poolIndex` and `postedSwap` are defined
  function _poolIndexFromPosted(uint200 postedSwap) internal pure returns (uint40) {
    return uint40(postedSwap);
  }
  
  /// @notice TODO: Decode/encode `xxx` from `yyy`
  /// TODO: refer to places where `xxx` and `yyy` are defined
  /// @notice Encode the variable: `lockedSwap:uint80` <- `until:uint40|poolIndex:uint40`
  ///   `lockedSwap` is the mapping value of `_lockedSwaps` in '../Pools/MesonPools.sol'.
  function _lockedSwapFrom(uint256 until, uint40 poolIndex) internal pure returns (uint80) {
    return (uint80(until) << 40) | poolIndex;
  }

  /// @notice TODO: Decode/encode `xxx` from `yyy`
  /// TODO: refer to places where `xxx` and `yyy` are defined
  /// @notice Decode the variable: `lockedSwap:uint80` -> `until:uint40|poolIndex:uint40`
  function _poolIndexFromLocked(uint80 lockedSwap) internal pure returns (uint40) {
    return uint40(lockedSwap);
  }

  /// @notice TODO: Decode/encode `xxx` from `yyy`
  /// TODO: refer to places where `xxx` and `yyy` are defined
  /// @notice Decode the variable: `lockedSwap:uint80` -> `until:uint40|poolIndex:uint40`
  function _untilFromLocked(uint80 lockedSwap) internal pure returns (uint256) {
    return uint256(lockedSwap >> 40);
  }

  /// @notice TODO: Decode/encode `xxx` from `yyy`
  /// TODO: refer to places where `xxx` and `yyy` are defined
  /// @notice Encode the variable: `poolTokenIndex:uint48` <- `tokenIndex:uint8|poolIndex:uint40`
  function _poolTokenIndexFrom(uint8 tokenIndex, uint40 poolIndex) internal pure returns (uint48) {
    return (uint48(tokenIndex) << 40) | poolIndex;
  }

  /// @notice TODO: Decode/encode `xxx` from `yyy`
  /// TODO: refer to places where `xxx` and `yyy` are defined
  /// @notice Decode the variable: `poolTokenIndex:uint48` -> `tokenIndex:uint8|poolIndex:uint40`
  function _tokenIndexFrom(uint48 poolTokenIndex) internal pure returns (uint8) {
    return uint8(poolTokenIndex >> 40);
  }

  /// @notice TODO: Decode/encode `xxx` from `yyy`
  /// TODO: refer to places where `xxx` and `yyy` are defined
  /// @notice Decode the variable: `poolTokenIndex:uint48` -> `tokenIndex:uint8|poolIndex:uint40`
  function _poolIndexFrom(uint48 poolTokenIndex) internal pure returns (uint40) {
    return uint40(poolTokenIndex);
  }

  // TODO: add comments
  // 1. this is to check the signature for swap request
  // 2. define params
  // 3. refer to SDK for how signature is contructed. See `packages/sdk/src/SwapSigner.ts`, class `EthersWalletSwapSigner` method `signSwapRequest`
  function _checkRequestSignature(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) internal pure {
    require(signer != address(0), "Signer cannot be empty address");

    bool nonTyped = _signNonTyped(encodedSwap);

    if (_inChainFrom(encodedSwap) == 0x00c3) {
      bytes32 digest = keccak256(abi.encodePacked(
        nonTyped
          ? bytes25(0x1954524f4e205369676e6564204d6573736167653a0a33330a)  // HEX of "\x19TRON Signed Message:\n33\n"
          : bytes25(0x1954524f4e205369676e6564204d6573736167653a0a33320a), // HEX of "\x19TRON Signed Message:\n32\n"
        encodedSwap
      ));
      require(signer == ecrecover(digest, v, r, s), "Invalid signature");
      return;
    }

    if (nonTyped) {
      bytes32 digest = keccak256(abi.encodePacked(
        bytes28(0x19457468657265756d205369676e6564204d6573736167653a0a3332), // HEX of "\x19Ethereum Signed Message:\n32"
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

  // TODO: add comments
  // 1. this is to check the signature for swap release
  // 2. define params
  // 3. refer to SDK for how signature is contructed. See `packages/sdk/src/SwapSigner.ts`, class `EthersWalletSwapSigner` method `signSwapRelease`
  function _checkReleaseSignature(
    uint256 encodedSwap,
    address recipient,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) internal pure {
    require(signer != address(0), "Signer cannot be empty address");

    bool nonTyped = _signNonTyped(encodedSwap);

    if (_inChainFrom(encodedSwap) == 0x00c3) {
      bytes32 digest = keccak256(abi.encodePacked(
        nonTyped
          ? bytes25(0x1954524f4e205369676e6564204d6573736167653a0a35330a)  // HEX of "\x19TRON Signed Message:\n53\n"
          : bytes25(0x1954524f4e205369676e6564204d6573736167653a0a33320a), // HEX of "\x19TRON Signed Message:\n32\n"
        encodedSwap,
        recipient
      ));
      require(signer == ecrecover(digest, v, r, s), "Invalid signature");
      return;
    }

    bytes32 digest;
    if (nonTyped) {
      digest = keccak256(abi.encodePacked(
        bytes28(0x19457468657265756d205369676e6564204d6573736167653a0a3332), // HEX of "\x19Ethereum Signed Message:\n32"
        keccak256(abi.encodePacked(encodedSwap, recipient))
      ));
    } else if (_outChainFrom(encodedSwap) == 0x00c3) {
      assembly {
        mstore(21, recipient)
        mstore8(32, 0x41)
        mstore(0, encodedSwap)
        mstore(32, keccak256(0, 53))
        // mstore(0, 0xcdd10eb72226dc70c96479571183c7d98ddba64dcc287980e7f6deceaad47c1c) // testnet
        mstore(0, 0xf6ea10de668a877958d46ed7d53eaf47124fda9bee9423390a28c203556a2e55) // mainnet
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
