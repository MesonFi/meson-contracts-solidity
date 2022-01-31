// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../libraries/LowGasSafeMath.sol";

import "./IMesonPools.sol";
import "../utils/MesonStates.sol";

/// @title MesonPools
/// @notice The class to manage liquidity pools for providers.
/// Methods in this class will be executed by LPs when users want to
/// swap into the current chain.
contract MesonPools is IMesonPools, MesonStates {
  mapping(bytes32 => uint240) internal _lockedSwaps;

  /// @inheritdoc IMesonPools
  function deposit(address token, uint128 amount) external override tokenSupported(token) {
    address provider = _msgSender();
    uint40 providerIndex = indexOfAddress[provider];
    require(providerIndex != 0, 'address not registered');

    _addProviderBalance(token, amount, providerIndex);
    _unsafeDepositToken(token, provider, amount);
  }

  function depositAndRegister(address token, uint128 amount, uint40 providerIndex)
    external override tokenSupported(token)
  {
    // possible attack: register a lot index and withdraw funds
    address provider = _msgSender();
    require(providerIndex != 0, "Cannot use index 0");
    require(addressOfIndex[providerIndex] == address(0), "Index already registered");
    require(indexOfAddress[provider] == 0, "Address already registered");
    addressOfIndex[providerIndex] = provider;
    indexOfAddress[provider] = providerIndex;

    _addProviderBalance(token, amount, providerIndex);
    _unsafeDepositToken(token, provider, amount);
  }

  function _addProviderBalance(
    address token,
    uint128 amount,
    uint40 providerIndex
  ) internal {
    uint8 tokenIndex = _indexOfToken[token];
    _tokenBalanceOf[tokenIndex][providerIndex] = LowGasSafeMath.add(
      _tokenBalanceOf[tokenIndex][providerIndex], amount
    );
  }

  /// @inheritdoc IMesonPools
  function withdraw(address token, uint128 amount) external override tokenSupported(token) {
    address provider = _msgSender();
    uint40 providerIndex = indexOfAddress[provider];
    require(providerIndex != 0, 'address not registered');
    uint8 tokenIndex = _indexOfToken[token];
    _tokenBalanceOf[tokenIndex][providerIndex] = LowGasSafeMath.sub(
      _tokenBalanceOf[tokenIndex][providerIndex], amount
    );
    _safeTransfer(token, provider, amount);
  }

  /// @inheritdoc IMesonPools
  function lock(
    uint256 encodedSwap,
    bytes32 domainHash,
    address initiator,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) external override {
    bytes32 swapId = _getSwapId(encodedSwap, domainHash);
    require(initiator == ecrecover(swapId, v, r, s), "invalid signature");

    uint128 amount = uint128(encodedSwap >> 128);
    uint8 tokenIndex = uint8(encodedSwap >> 8);
    require(amount > 0, "amount must be greater than zero");
    require(_lockedSwaps[swapId] == 0, "locking swap already exists");

    uint40 providerIndex = indexOfAddress[_msgSender()];
    require(_tokenBalanceOf[tokenIndex][providerIndex] >= amount, "insufficient balance");
    _tokenBalanceOf[tokenIndex][providerIndex] = _tokenBalanceOf[tokenIndex][providerIndex] - amount;
    
    _lockedSwaps[swapId] = (uint240(uint40(block.timestamp) + LOCK_TIME_PERIOD) << 200)
      | (uint240(providerIndex) << 160)
      | uint160(initiator);

    emit SwapLocked(swapId);
  }

  /// @inheritdoc IMesonPools
  function unlock(
    uint256 encodedSwap,
    bytes32 domainHash
  ) external override {
    bytes32 swapId = _getSwapId(encodedSwap, domainHash);

    uint240 lockedSwap = _lockedSwaps[swapId];
    require(lockedSwap != 0, "swap does not exist");
    require(uint240(block.timestamp << 200) > lockedSwap, "The swap is still in lock");

    uint40 providerIndex = uint40(lockedSwap >> 160);
    uint128 amount = uint128(encodedSwap >> 128);
    uint8 tokenIndex = uint8(encodedSwap >> 8);

    _tokenBalanceOf[tokenIndex][providerIndex] = LowGasSafeMath.add(
      _tokenBalanceOf[tokenIndex][providerIndex], amount
    );
    _lockedSwaps[swapId] = 0;
  }

  /// @inheritdoc IMesonPools
  function release(
    uint256 encodedSwap,
    bytes32 domainHash,
    address recipient,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) external override {
    bytes32 swapId = _getSwapId(encodedSwap, domainHash);

    uint240 lockedSwap = _lockedSwaps[swapId];
    require(lockedSwap != 0, "swap does not exist");

    address initiator = address(uint160(lockedSwap));
    _checkReleaseSignature(swapId, recipient, domainHash, r, s, v, initiator);

    address token = _tokenList[uint8(encodedSwap >> 8)];

    _lockedSwaps[swapId] = 0;

    _safeTransfer(token, recipient, uint128(encodedSwap >> 128));

    emit SwapReleased(swapId);
  }

  function getLockedSwap(bytes32 swapId) external view
    returns (address initiator, address provider, uint40 until)
  {
    uint240 lockedSwap = _lockedSwaps[swapId];
    initiator = address(uint160(lockedSwap));
    provider = addressOfIndex[uint40(lockedSwap >> 160)];
    until = uint40(lockedSwap >> 200);
  }
}
