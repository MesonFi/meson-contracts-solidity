// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/utils/Context.sol";
import "./MesonConfig.sol";

/// @title MesonHelpers
/// @notice The class that provides helper functions for Meson protocol
contract MesonHelpers is MesonConfig, Context {
  modifier matchProtocolVersion(uint256 encodedSwap) {
    require(_versionFrom(encodedSwap) == MESON_PROTOCOL_VERSION, "Incorrect encoding version");
    _;
  }

  function getShortCoinType() external pure returns (bytes2) {
    return bytes2(SHORT_COIN_TYPE);
  }

  /// @notice Calculate `swapId` from `encodedSwap`, `initiator`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  function _getSwapId(uint256 encodedSwap, address initiator) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(encodedSwap, initiator));
  }

  /// @notice Decode `version` from `encodedSwap`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  function _versionFrom(uint256 encodedSwap) internal pure returns (uint8) {
    return uint8(encodedSwap >> 248);
  }

  /// @notice Decode `amount` from `encodedSwap`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  function _amountFrom(uint256 encodedSwap) internal pure returns (uint256) {
    return (encodedSwap >> 208) & 0xFFFFFFFFFF;
  }

  /// @notice Calculate the service fee from `encodedSwap`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  function _serviceFee(uint256 encodedSwap) internal pure returns (uint256) {
    uint256 minFee = _inTokenIndexFrom(encodedSwap) >= 254 ? SERVICE_FEE_MINIMUM_ETH : SERVICE_FEE_MINIMUM;
    // Default to `serviceFee` = 0.05% * `amount`
    uint256 fee = _amountFrom(encodedSwap) * SERVICE_FEE_RATE / 10000;
    return fee > minFee ? fee : minFee;
  }

  /// @notice Decode `fee` (the fee for LPs) from `encodedSwap`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  function _feeForLp(uint256 encodedSwap) internal pure returns (uint256) {
    return (encodedSwap >> 88) & 0xFFFFFFFFFF;
  }

  /// @notice Decode `salt` from `encodedSwap`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  function _saltFrom(uint256 encodedSwap) internal pure returns (uint80) {
    return uint80(encodedSwap >> 128);
  }

  /// @notice Decode data from `salt`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  function _saltDataFrom(uint256 encodedSwap) internal pure returns (uint64) {
    return uint64(encodedSwap >> 128);
  }

  /// @notice Decode method id from `data`
  function _methodIdFromData(uint64 data) internal pure returns (uint8) {
    return uint8(data >> 56);
  }

  /// @notice Whether the swap should release to a 3rd-party integrated dapp contract
  /// See method `release` in `MesonPools.sol` for more details
  function _willTransferToContract(uint256 encodedSwap) internal pure returns (bool) {
    return (encodedSwap & 0x8000000000000000000000000000000000000000000000000000) == 0;
  }

  /// @notice Whether the swap needs to pay service fee
  /// See method `release` in `MesonPools.sol` for more details about the service fee
  function _feeWaived(uint256 encodedSwap) internal pure returns (bool) {
    return (encodedSwap & 0x4000000000000000000000000000000000000000000000000000) > 0;
  }
  
  /// @notice Whether the swap was signed in the non-typed manner (usually by hardware wallets)
  function _signNonTyped(uint256 encodedSwap) internal pure returns (bool) {
    return (encodedSwap & 0x0800000000000000000000000000000000000000000000000000) > 0;
  }

  function _swapForCoreToken(uint256 encodedSwap) internal pure returns (bool) {
    return !_willTransferToContract(encodedSwap) && (_outTokenIndexFrom(encodedSwap) < 254) &&
      ((encodedSwap & 0x0400000000000000000000000000000000000000000000000000) > 0);
  }

  function _amountForCoreTokenFrom(uint256 encodedSwap) internal pure returns (uint256) {
    if (_swapForCoreToken(encodedSwap)) {
      return ((encodedSwap >> 160) & 0x00000FFF) * 1e5;
    }
    return 0;
  }

  function _coreTokenAmount(uint256 encodedSwap) internal pure returns (uint256) {
    uint256 amountForCore = _amountForCoreTokenFrom(encodedSwap);
    if (amountForCore > 0) {
      return amountForCore * 10 / ((encodedSwap >> 172) & 0xFFFFF);
    }
    return 0;
  }

  function _amountToLock(uint256 encodedSwap) internal pure returns (uint256) {
    return _amountFrom(encodedSwap) - _feeForLp(encodedSwap) - _amountForCoreTokenFrom(encodedSwap);
  }

  /// @notice Decode `expireTs` from `encodedSwap`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  function _expireTsFrom(uint256 encodedSwap) internal pure returns (uint256) {
    return (encodedSwap >> 48) & 0xFFFFFFFFFF;
    // [Suggestion]: return uint40(encodedSwap >> 48);
  }

  /// @notice Decode the initial chain (`inChain`) from `encodedSwap`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  function _inChainFrom(uint256 encodedSwap) internal pure returns (uint16) {
    return uint16(encodedSwap >> 8);
  }

  /// @notice Decode the token index of initial chain (`inToken`) from `encodedSwap`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  function _inTokenIndexFrom(uint256 encodedSwap) internal pure returns (uint8) {
    return uint8(encodedSwap);
  }

  /// @notice Decode the target chain (`outChain`) from `encodedSwap`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  function _outChainFrom(uint256 encodedSwap) internal pure returns (uint16) {
    return uint16(encodedSwap >> 32);
  }

  /// @notice Decode the token index of target chain (`outToken`) from `encodedSwap`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  function _outTokenIndexFrom(uint256 encodedSwap) internal pure returns (uint8) {
    return uint8(encodedSwap >> 24);
  }

  /// @notice Decode `outToken` from `encodedSwap`, and encode it with `poolIndex` to `poolTokenIndex`.
  /// See variable `_balanceOfPoolToken` in `MesonStates.sol` for the defination of `poolTokenIndex`
  function _poolTokenIndexForOutToken(uint256 encodedSwap, uint40 poolIndex) internal pure returns (uint48) {
    return uint48((encodedSwap & 0xFF000000) << 16) | poolIndex;
  }

  /// @notice Decode `initiator` from `postedSwap`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `postedSwap`
  function _initiatorFromPosted(uint200 postedSwap) internal pure returns (address) {
    return address(uint160(postedSwap >> 40));
  }

  /// @notice Decode `poolIndex` from `postedSwap`
  /// See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `postedSwap`
  function _poolIndexFromPosted(uint200 postedSwap) internal pure returns (uint40) {
    return uint40(postedSwap);
  }
  
  /// @notice Encode `lockedSwap` from `until` and `poolIndex`
  /// See variable `_lockedSwaps` in `MesonPools.sol` for the defination of `lockedSwap`
  function _lockedSwapFrom(uint256 until, uint40 poolIndex) internal pure returns (uint80) {
    return (uint80(until) << 40) | poolIndex;
  }

  /// @notice Decode `poolIndex` from `lockedSwap`
  /// See variable `_lockedSwaps` in `MesonPools.sol` for the defination of `lockedSwap`
  function _poolIndexFromLocked(uint80 lockedSwap) internal pure returns (uint40) {
    return uint40(lockedSwap);
  }

  /// @notice Decode `until` from `lockedSwap`
  /// See variable `_lockedSwaps` in `MesonPools.sol` for the defination of `lockedSwap`
  function _untilFromLocked(uint80 lockedSwap) internal pure returns (uint256) {
    return uint256(lockedSwap >> 40);
  }

  /// @notice Encode `poolTokenIndex` from `tokenIndex` and `poolIndex`
  /// See variable `_balanceOfPoolToken` in `MesonStates.sol` for the defination of `poolTokenIndex`
  function _poolTokenIndexFrom(uint8 tokenIndex, uint40 poolIndex) internal pure returns (uint48) {
    return (uint48(tokenIndex) << 40) | poolIndex;
  }

  /// @notice Decode `tokenIndex` from `poolTokenIndex`
  /// See variable `_balanceOfPoolToken` in `MesonStates.sol` for the defination of `poolTokenIndex`
  function _tokenIndexFrom(uint48 poolTokenIndex) internal pure returns (uint8) {
    return uint8(poolTokenIndex >> 40);
  }

  /// @notice Decode `poolIndex` from `poolTokenIndex`
  /// See variable `_balanceOfPoolToken` in `MesonStates.sol` for the defination of `poolTokenIndex`
  function _poolIndexFrom(uint48 poolTokenIndex) internal pure returns (uint40) {
    return uint40(poolTokenIndex);
  }

  /// @notice Check the initiator's signature for a swap request
  /// Signatures are constructed with the package `mesonfi/sdk`. Go to `packages/sdk/src/SwapSigner.ts` and 
  /// see how to generate a signautre in class `EthersWalletSwapSigner` method `signSwapRequest`
  /// @param encodedSwap Encoded swap information. See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  /// @param r Part of the signature
  /// @param yParityAndS Part of the signature
  /// @param signer The signer for the swap request which is the `initiator`
  function _checkRequestSignature(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 yParityAndS,
    address signer
  ) internal pure {
    require(signer != address(0), "Signer cannot be empty address");
    bytes32 s = yParityAndS & bytes32(0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
    uint8 v = uint8((uint256(yParityAndS) >> 255) + 27);
    require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, "Invalid signature");

    bool nonTyped = _signNonTyped(encodedSwap);
    bytes32 digest;
    if (_inChainFrom(encodedSwap) == 0x00c3) {
      digest = keccak256(abi.encodePacked(nonTyped ? TRON_SIGN_HEADER_33 : TRON_SIGN_HEADER, encodedSwap));
    } else if (nonTyped) {
      digest = keccak256(abi.encodePacked(ETH_SIGN_HEADER, encodedSwap));
    } else {
      bytes32 typehash = REQUEST_TYPE_HASH;
      assembly {
        mstore(0, encodedSwap)
        mstore(32, keccak256(0, 32))
        mstore(0, typehash)
        digest := keccak256(0, 64)
      }
    }
    require(signer == ecrecover(digest, v, r, s), "Invalid signature");
  }

  /// @notice Check the initiator's signature for the release request
  /// Signatures are constructed with the package `mesonfi/sdk`. Go to `packages/sdk/src/SwapSigner.ts` and 
  /// see how to generate a signautre in class `EthersWalletSwapSigner` method `signSwapRelease`
  /// @param encodedSwap Encoded swap information. See variable `_postedSwaps` in `MesonSwap.sol` for the defination of `encodedSwap`
  /// @param recipient The recipient address of the swap
  /// @param r Part of the signature
  /// @param yParityAndS Part of the signature
  /// @param signer The signer for the swap request which is the `initiator`
  function _checkReleaseSignature(
    uint256 encodedSwap,
    address recipient,
    bytes32 r,
    bytes32 yParityAndS,
    address signer
  ) internal pure {
    require(signer != address(0), "Signer cannot be empty address");
    bytes32 s = yParityAndS & bytes32(0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
    uint8 v = uint8((uint256(yParityAndS) >> 255) + 27);
    require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, "Invalid signature");

    bool nonTyped = _signNonTyped(encodedSwap);
    bytes32 digest;
    if (_inChainFrom(encodedSwap) == 0x00c3) {
      digest = keccak256(abi.encodePacked(nonTyped ? TRON_SIGN_HEADER_53 : TRON_SIGN_HEADER, encodedSwap, recipient));
    } else if (nonTyped) {
      digest = keccak256(abi.encodePacked(ETH_SIGN_HEADER_52, encodedSwap, recipient));
    } else {
      bytes32 typehash = _outChainFrom(encodedSwap) == 0x00c3 ? RELEASE_TO_TRON_TYPE_HASH : RELEASE_TYPE_HASH;
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
