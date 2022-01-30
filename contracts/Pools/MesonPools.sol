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
  mapping(bytes32 => LockedSwap) internal _lockedSwaps;

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
    bytes32 tokenHash = _tokenHashByAddress[token];
    _tokenBalanceOf[tokenHash][providerIndex] = LowGasSafeMath.add(
      _tokenBalanceOf[tokenHash][providerIndex], amount
    );
  }

  /// @inheritdoc IMesonPools
  function withdraw(address token, uint128 amount) external override tokenSupported(token) {
    address provider = _msgSender();
    uint40 providerIndex = indexOfAddress[provider];
    require(providerIndex != 0, 'address not registered');
    bytes32 tokenHash = _tokenHashByAddress[token];
    _tokenBalanceOf[tokenHash][providerIndex] = LowGasSafeMath.sub(
      _tokenBalanceOf[tokenHash][providerIndex], amount
    );
    _safeTransfer(token, provider, amount);
  }

  /// @inheritdoc IMesonPools
  function lock(
    bytes calldata encodedSwap,
    bytes32 domainHash,
    address initiator,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) external override {
    bytes32 swapId = _getSwapId(encodedSwap, domainHash);
    require(initiator == ecrecover(swapId, v, r, s), "invalid signature");

    (uint128 amount, bytes32 tokenHash) = _decodeSwapOutput(encodedSwap);
    require(amount > 0, "amount must be greater than zero");
    require(_lockedSwaps[swapId].providerIndex == 0, "locking swap already exists");

    uint40 providerIndex = indexOfAddress[_msgSender()];
    require(_tokenBalanceOf[tokenHash][providerIndex] >= amount, "insufficient balance");

    _tokenBalanceOf[tokenHash][providerIndex] = _tokenBalanceOf[tokenHash][providerIndex] - amount;
    
    _lockedSwaps[swapId] = LockedSwap(
      providerIndex,
      uint48(block.timestamp) + LOCK_TIME_PERIOD
    );

    emit SwapLocked(swapId);
  }

  /// @inheritdoc IMesonPools
  function unlock(
    bytes calldata encodedSwap,
    bytes32 domainHash
  ) external override {
    bytes32 swapId = _getSwapId(encodedSwap, domainHash);

    LockedSwap memory lockedSwap = _lockedSwaps[swapId];
    uint40 providerIndex = lockedSwap.providerIndex;

    require(providerIndex != 0, "swap does not exist");
    require(uint48(block.timestamp) > lockedSwap.until, "The swap is still in lock");

    (uint128 amount, bytes32 tokenHash) = _decodeSwapOutput(encodedSwap);

    _tokenBalanceOf[tokenHash][providerIndex] = LowGasSafeMath.add(
      _tokenBalanceOf[tokenHash][providerIndex], amount
    );
    delete _lockedSwaps[swapId];
  }

  /// @inheritdoc IMesonPools
  function release(
    bytes calldata encodedSwap,
    bytes32 domainHash,
    address initiator,
    address recipient,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) external override {
    bytes32 swapId = _getSwapId(encodedSwap, domainHash);

    LockedSwap memory lockedSwap = _lockedSwaps[swapId];
    require(lockedSwap.providerIndex != 0, "swap does not exist");

    _checkReleaseSignature(swapId, keccak256(abi.encodePacked(recipient)), domainHash, initiator, r, s, v);

    (uint128 amount, bytes32 tokenHash) = _decodeSwapOutput(encodedSwap);
    address token = _tokenAddressByHash[tokenHash];

    delete _lockedSwaps[swapId];

    _safeTransfer(token, recipient, amount);

    emit SwapReleased(swapId);
  }

  function getLockedSwap(bytes32 swapId) external view
    returns (address provider, uint48 until)
  {
    LockedSwap memory lockedSwap = _lockedSwaps[swapId];
    uint40 providerIndex = lockedSwap.providerIndex;
    provider = addressOfIndex[providerIndex];
    until = lockedSwap.until;
  }
}
