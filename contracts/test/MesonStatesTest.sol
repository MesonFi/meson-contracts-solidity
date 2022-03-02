// SPDX-License-Identifier: MIT
pragma solidity =0.8.6;

import "../utils/MesonStates.sol";

contract MesonStatesTest is MesonStates {
  function addSupportToken(address token, uint8 index) external {
    _addSupportToken(token, index);
  }

  function encodeSwap(
    uint48 amount,
    uint80 salt,
    uint40 fee,
    uint40 expireTs,
    bytes2 outChain,
    uint8 outToken,
    bytes2 inChain,
    uint8 inToken
  ) external pure returns (bytes memory) {
    return
      abi.encodePacked(
        amount,
        salt,
        fee,
        expireTs,
        outChain,
        outToken,
        inChain,
        inToken
      );
  }

  function decodeSwap(uint256 encodedSwap, uint40 providerIndex) external pure returns (
    uint256 amount,
    uint256 fee,
    uint256 feeToMeson,
    uint80 salt,
    uint256 expireTs,
    bytes2 inChain,
    uint8 inTokenIndex,
    bytes2 outChain,
    uint8 outTokenIndex,
    bytes6 balanceIndexForMeson,
    bytes6 outTokenBalanceIndex
  ) {
    amount = _amountFrom(encodedSwap);
    fee = _feeFrom(encodedSwap);
    feeToMeson = _feeToMesonFrom(encodedSwap);
    salt = _saltFrom(encodedSwap);
    expireTs = _expireTsFrom(encodedSwap);
    inChain = bytes2(_inChainFrom(encodedSwap));
    inTokenIndex = _inTokenIndexFrom(encodedSwap);
    outChain = bytes2(_outChainFrom(encodedSwap));
    outTokenIndex = _outTokenIndexFrom(encodedSwap);
    balanceIndexForMeson = bytes6(_balanceIndexForMesonFrom(encodedSwap));
    outTokenBalanceIndex = bytes6(_outTokenBalanceIndexFrom(encodedSwap, providerIndex));
  }

  function decodePostedSwap(uint200 postedSwap) external pure returns (
    address initiator,
    uint40 providerIndex
  ) {
    initiator = _initiatorFromPosted(postedSwap);
    providerIndex = _providerIndexFromPosted(postedSwap);
  }

  function lockedSwapFrom(uint256 until, uint40 providerIndex) external pure returns (uint80) {
    return _lockedSwapFrom(until, providerIndex);
  }

  function decodeLockedSwap(uint80 lockedSwap) external pure returns (uint40 providerIndex, uint256 until) {
    providerIndex = _providerIndexFromLocked(lockedSwap);
    until = _untilFromLocked(lockedSwap);
  }

  function balanceIndexFrom(uint8 tokenIndex, uint40 providerIndex) external pure returns (bytes6) {
    return bytes6(_balanceIndexFrom(tokenIndex, providerIndex));
  }

  function decodeBalanceIndex(uint48 balanceIndex) external pure returns (
    uint8 tokenIndex,
    uint40 providerIndex
  ) {
    tokenIndex = _tokenIndexFromBalanceIndex(balanceIndex);
    providerIndex = _providerIndexFromBalanceIndex(balanceIndex);
  }

  function checkRequestSignature(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) external pure {
    _checkRequestSignature(encodedSwap, r, s, v, signer);
  }

  function checkReleaseSignature(
    uint256 encodedSwap,
    address recipient,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) external pure {
    _checkReleaseSignature(encodedSwap, recipient, r, s, v, signer);
  }
}
