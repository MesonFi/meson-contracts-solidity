// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../libraries/LowGasSafeMath.sol";

import "./IMesonSwapEvents.sol";
import "../utils/MesonStates.sol";

/// @title MesonSwap
/// @notice The class to receive and process swap requests.
/// Methods in this class will be executed by users or LPs when
/// users initiate swaps on the initial chain.
contract MesonSwap is IMesonSwapEvents, MesonStates {
  /// @notice Posted swap requests
  /// key: encodedSwap in format of `amount:uint96|salt:uint32|fee:uint40|expireTs:uint40|outChain:uint16|outToken:uint8|inChain:uint16|inToken:uint8`
  /// value: in format of initiator:uint160|providerIndex:uint40; =1 maybe means executed (to prevent replay attack)
  mapping(uint256 => uint200) internal _swapRequests;

  /// @notice xxxx
  /// @dev Designed to be used by users
  /// @param encodedSwap Packed in format of `amount:uint128|fee:uint40|expireTs:uint40|outChain:uint16|outToken:uint8|inChain:uint16|inToken:uint8`
  function requestSwap(uint256 encodedSwap) external forInitialChain(encodedSwap) {
    require(_swapRequests[encodedSwap] == 0, "Swap already exists");

    uint256 delta = ((encodedSwap >> 48) & 0xFFFFFFFFFF) - block.timestamp;
    // Underflow would trigger "Expire ts too late" error
    require(delta > MIN_BOND_TIME_PERIOD, "Expire ts too early");
    require(delta < MAX_BOND_TIME_PERIOD, "Expire ts too late");

    address initiator = _msgSender();
    _swapRequests[encodedSwap] = uint200(uint160(initiator)) << 40;
    
    _unsafeDepositToken(_tokenList[uint8(encodedSwap)], initiator, encodedSwap >> 160);
    
    emit SwapRequested(encodedSwap);
  }

  /// @notice xxxx
  /// @dev Designed to be used by LPs
  function bondSwap(uint256 encodedSwap, uint40 providerIndex) external {
    uint200 req = _swapRequests[encodedSwap];
    require(req != 0, "Swap does not exist");
    require(uint40(req) == 0, "Swap bonded to another provider");

    _swapRequests[encodedSwap] = req | providerIndex;
    emit SwapBonded(encodedSwap);
  }

  /// @notice A liquidity provider can call this method to post the swap and bond it
  /// to himself.
  /// This is step 1️⃣  in a swap.
  /// The bonding state will last until `expireTs` and at most one LP can be bonded.
  /// The bonding LP should call `release` and `executeSwap` later
  /// to finish the swap within the bonding period.
  /// After the bonding period expires, other LPs can bond again (wip),
  /// or the user can cancel the swap.
  /// @dev Designed to be used by LPs
  /// @param encodedSwap Encoded swap
  /// @param r Part of the signature
  /// @param s Part of the signature
  /// @param packedData Packed in format of `v:uint8|initiator:address|providerIndex:uint40` to save gas
  function postSwap(uint256 encodedSwap, bytes32 r, bytes32 s, uint208 packedData)
    external forInitialChain(encodedSwap)
  {
    require(_swapRequests[encodedSwap] == 0, "Swap already exists");

    uint256 delta = ((encodedSwap >> 48) & 0xFFFFFFFFFF) - block.timestamp;
    // Underflow would trigger "Expire ts too late" error
    require(delta > MIN_BOND_TIME_PERIOD, "Expire ts too early");
    require(delta < MAX_BOND_TIME_PERIOD, "Expire ts too late");

    address initiator = address(uint160(packedData >> 40));
    _checkRequestSignature(encodedSwap, r, s, uint8(packedData >> 200), initiator);
    _swapRequests[encodedSwap] = uint200(packedData);

    _unsafeDepositToken(_tokenList[uint8(encodedSwap)], initiator, encodedSwap >> 160);

    emit SwapPosted(encodedSwap);
  }

  /// @notice Cancel a swap
  /// @dev Designed to be used by users
  /// @param encodedSwap Encoded swap
  function cancelSwap(uint256 encodedSwap) external {
    uint200 req = _swapRequests[encodedSwap];
    require(req > 1, "Swap does not exist");
    require((encodedSwap >> 48 & 0xFFFFFFFFFF) < block.timestamp, "Swap is still locked");
    
    _swapRequests[encodedSwap] = 0; // Swap expired so the same one cannot be posted again

    _safeTransfer(
      _tokenList[uint8(encodedSwap)], // tokenIndex -> token address
      address(uint160(req >> 40)), // initiator
      encodedSwap >> 160
    );

    emit SwapCancelled(encodedSwap);
  }

  /// @notice Execute the swap by providing a signature.
  /// This is step 4️⃣  in a swap.
  /// Once the signature is verified, the current bonding LP (provider)
  /// will receive tokens initially deposited by the user.
  /// The LP should call `release` first.
  /// For a single swap, signature given here is identical to the one used
  /// in `release`.
  /// Otherwise, other people can use the signature to `challenge` the LP.
  /// @dev Designed to be used by the current bonding LP
  /// @param encodedSwap Encoded swap
  function executeSwap(
    uint256 encodedSwap,
    bytes32 recipientHash,
    bytes32 r,
    bytes32 s,
    uint8 v,
    bool depositToPool
  ) external {
    uint200 req = _swapRequests[encodedSwap];
    require(req != 0, "Swap does not exist");

    if (((encodedSwap >> 48) & 0xFFFFFFFFFF) < block.timestamp + MIN_BOND_TIME_PERIOD) {
      // Swap expiredTs < current + MIN_BOND_TIME_PERIOD
      // The swap cannot be posted again and therefore safe to remove it
      // LPs who execute in this mode can save ~5000 gas
      _swapRequests[encodedSwap] = 0;
    } else {
      // 1 will prevent the same swap to be posted again
      _swapRequests[encodedSwap] = 1;
    }

    // TODO: fee to meson protocol

    _checkReleaseSignature(encodedSwap, recipientHash, r, s, v, address(uint160(req >> 40)));

    if (depositToPool) {
      uint48 balanceIndex = uint48(encodedSwap << 40) | uint40(req); // TODO: check
      _tokenBalanceOf[balanceIndex] = LowGasSafeMath.add(_tokenBalanceOf[balanceIndex], encodedSwap >> 160);
    } else {
      _safeTransfer(
        _tokenList[uint8(encodedSwap)], // tokenIndex -> token address
        addressOfIndex[uint40(req)], // providerIndex -> provider address
        encodedSwap >> 160
      );
    }
  }

  function swapInitiator(uint256 encodedSwap) external view returns (address) {
    uint200 req = _swapRequests[encodedSwap];
    return address(uint160(req >> 40));
  }

  function swapProvider(uint256 encodedSwap) external view returns (address) {
    uint200 req = _swapRequests[encodedSwap];
    if (req >> 40 == 0) {
      return address(0);
    }
    return addressOfIndex[uint40(req)];
  }

  modifier forInitialChain(uint256 encodedSwap) {
    require(uint16(encodedSwap >> 8) == SHORT_COIN_TYPE, "Swap not for this chain");
    _;
  }
}
