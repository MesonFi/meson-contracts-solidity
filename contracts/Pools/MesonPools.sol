// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../libraries/LowGasSafeMath.sol";

import "./IMesonPoolsEvents.sol";
import "../utils/MesonStates.sol";

/// @title MesonPools
/// @notice The class to manage liquidity pools for providers.
/// Methods in this class will be executed by LPs when users want to
/// swap into the current chain.
contract MesonPools is IMesonPoolsEvents, MesonStates {
  mapping(uint256 => uint240) internal _lockedSwaps;

  function depositAndRegister(uint256 amount, uint48 balanceIndex) external {
    require(amount > 0, 'Amount must be positive');

    address provider = _msgSender();
    uint40 providerIndex = uint40(balanceIndex);
    require(providerIndex != 0, "Cannot use 0 as provider index");
    require(addressOfIndex[providerIndex] == address(0), "Index already registered");
    require(indexOfAddress[provider] == 0, "Address already registered");
    addressOfIndex[providerIndex] = provider;
    indexOfAddress[provider] = providerIndex;

    _tokenBalanceOf[balanceIndex] = LowGasSafeMath.add(_tokenBalanceOf[balanceIndex], amount);
    _unsafeDepositToken(_tokenList[uint8(balanceIndex >> 40)], provider, amount);
  }

  /// @notice Deposit tokens into the liquidity pool. This is the
  /// prerequisite for LPs if they want to participate in swap
  /// trades.
  /// The LP should be careful to make sure the `balanceIndex` is correct.
  /// Make sure to call `depositAndRegister` first and register a provider index.
  /// Otherwise, token may be deposited to others.
  /// @dev Designed to be used by liquidity providers
  /// @param amount The amount to be added to the pool
  /// @param balanceIndex `[tokenIndex:uint8][providerIndex:uint40]
  function deposit(uint256 amount, uint48 balanceIndex) external {
    require(amount > 0, 'Amount must be positive');
    _tokenBalanceOf[balanceIndex] = LowGasSafeMath.add(_tokenBalanceOf[balanceIndex], amount);
    _unsafeDepositToken(_tokenList[uint8(balanceIndex >> 40)], _msgSender(), amount);
  }

  /// @notice Withdraw tokens from the liquidity pool. In order to make sure
  /// pending swaps can be satisfied, withdraw have a rate limit that
  /// in each epoch, total amounts to release (to users) and withdraw
  /// (to LP himself) cannot exceed MAX_RELEASE_AMOUNT_BY_EPOCH.
  /// This method will only run in the current epoch. Use `release`
  /// if wish to increment epoch.
  /// @dev Designed to be used by liquidity providers
  /// @param amount The amount to be removed from the pool
  /// @param tokenIndex The contract address of the withdrawing token
  function withdraw(uint256 amount, uint8 tokenIndex) external {
    address provider = _msgSender();
    uint40 providerIndex = indexOfAddress[provider];
    require(providerIndex != 0, 'Caller not registered. Call depositAndRegister');

    uint48 balanceIndex = (uint48(tokenIndex) << 40) | providerIndex;
    _tokenBalanceOf[balanceIndex] = LowGasSafeMath.sub(_tokenBalanceOf[balanceIndex], amount);
    _safeTransfer(_tokenList[tokenIndex], provider, amount);
  }

  function lock(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address initiator
  ) external forTargetChain(encodedSwap) {
    require(_lockedSwaps[encodedSwap] == 0, "Swap already exists");
    _checkRequestSignature(encodedSwap, r, s, v, initiator);

    uint40 providerIndex = indexOfAddress[_msgSender()];
    require(providerIndex != 0, "Caller not registered. Call depositAndRegister.");

    uint48 balanceIndex = uint48((encodedSwap & 0xFF000000) << 16) | providerIndex;
    _tokenBalanceOf[balanceIndex] = LowGasSafeMath.sub(_tokenBalanceOf[balanceIndex], encodedSwap >> 160);
    
    _lockedSwaps[encodedSwap] = (uint240(block.timestamp + LOCK_TIME_PERIOD) << 200)
      | (providerIndex << 160)
      | uint160(initiator);

    emit SwapLocked(encodedSwap);
  }

  function unlock(uint256 encodedSwap) external {
    uint240 lockedSwap = _lockedSwaps[encodedSwap];
    require(lockedSwap != 0, "Swap does not exist");
    require(uint240(block.timestamp << 200) > lockedSwap, "Swap still in lock");

    uint48 balanceIndex = uint48((encodedSwap & 0xFF000000) << 16) | uint40(lockedSwap >> 160);
    _tokenBalanceOf[balanceIndex] = LowGasSafeMath.add(_tokenBalanceOf[balanceIndex], encodedSwap >> 160);
    _lockedSwaps[encodedSwap] = 0;
  }

  /// @notice Release tokens to satisfy a user's swap request.
  /// This is step 3️⃣  in a swap.
  /// The LP should call this first before calling `executeSwap`.
  /// Otherwise, other people can use the signature to challenge the LP.
  /// For a single swap, signature given here is identical to the one used
  /// in `executeSwap`.
  /// @dev Designed to be used by liquidity providers
  function release(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address recipient
  ) external {
    uint240 lockedSwap = _lockedSwaps[encodedSwap];
    require(lockedSwap != 0, "Swap does not exist");

    _checkReleaseSignature(encodedSwap, keccak256(abi.encodePacked(recipient)), r, s, v, address(uint160(lockedSwap)));
    _lockedSwaps[encodedSwap] = 0;

    address token = _tokenList[uint8(encodedSwap >> 24)];
    _safeTransfer(token, recipient, encodedSwap >> 160);

    emit SwapReleased(encodedSwap);
  }

  function getLockedSwap(uint256 encodedSwap) external view
    returns (address initiator, address provider, uint40 until)
  {
    uint240 lockedSwap = _lockedSwaps[encodedSwap];
    initiator = address(uint160(lockedSwap));
    provider = addressOfIndex[uint40(lockedSwap >> 160)];
    until = uint40(lockedSwap >> 200);
  }

  modifier forTargetChain(uint256 encodedSwap) {
    require(uint16(encodedSwap >> 32) == SHORT_COIN_TYPE, "Swap not for this chain");
    _;
  }
}
