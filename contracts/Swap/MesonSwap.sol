// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../libraries/LowGasSafeMath.sol";

import "./IMesonSwapEvents.sol";
import "../utils/MesonStates.sol";

/// @title MesonSwap
/// @notice The class to receive and process swap requests.
/// Methods in this class will be executed by swap initiators or LPs
/// on the initial chain of swaps.
contract MesonSwap is IMesonSwapEvents, MesonStates {
  /// @notice Posted Swaps
  /// key: encodedSwap in format of `amount:uint96|salt:uint32|fee:uint40|expireTs:uint40|outChain:uint16|outToken:uint8|inChain:uint16|inToken:uint8`
  /// value: in format of initiator:uint160|providerIndex:uint40; =1 maybe means executed (to prevent replay attack)
  mapping(uint256 => uint200) internal _postedSwaps;

  /// @notice Anyone can call this method to post a swap request. This is step 1️⃣  in a swap.
  /// The r,s,v signature must be signed by the swap initiator. The initiator can call 
  /// this method directly, in which case `providerIndex` should be zero and wait for LPs 
  /// to call `bondSwap`. Initiators can also send the swap requests offchain (through the 
  /// meson relayer service). An liquidity provider who receives requests through the relayer
  /// can call this method to post and bond the swap in a single contract execution,
  /// in which case he should give his own `providerIndex`.
  /// 
  /// The swap will last until `expireTs` and at most one LP can bond to it.
  /// After the swap expires, the initiator can cancel the swap ande withdraw funds.
  ///
  /// Once a swap is posted and bonded, the bonding LP should call `lock` on the target chain.
  ///
  /// @dev Designed to be used by both swap initiators and LPs
  /// @param encodedSwap Encoded swap information; also used as the key of `_postedSwaps`
  /// @param r Part of the signature
  /// @param s Part of the signature
  /// @param v Part of the signature
  /// @param postingValue In format of `initiator:address|providerIndex:uint40` to save gas
  function postSwap(uint256 encodedSwap, bytes32 r, bytes32 s, uint8 v, uint200 postingValue)
    external forInitialChain(encodedSwap)
  {
    require(_postedSwaps[encodedSwap] == 0, "Swap already exists");

    uint256 delta = ((encodedSwap >> 48) & 0xFFFFFFFFFF) - block.timestamp;
    // Underflow would trigger "Expire ts too late" error
    require(delta > MIN_BOND_TIME_PERIOD, "Expire ts too early");
    require(delta < MAX_BOND_TIME_PERIOD, "Expire ts too late");

    address initiator = address(uint160(postingValue >> 40));
    _checkRequestSignature(encodedSwap, r, s, v, initiator);
    _postedSwaps[encodedSwap] = postingValue;

    _unsafeDepositToken(_tokenList[uint8(encodedSwap)], initiator, encodedSwap >> 160);

    if (uint40(postingValue) > 0) {
      emit SwapBonded(encodedSwap);
    } else {
      emit SwapPosted(encodedSwap);
    }
  }

  /// @notice If `postSwap` is called by the initiator of the swap and `providerIndex`
  /// is zero, an LP can call this to bond the swap to himself.
  /// @dev Designed to be used by LPs
  /// @param encodedSwap Encoded swap information; also used as the key of `_postedSwaps`
  /// @param providerIndex An index for the LP; call `depositAndRegister` to get an index
  function bondSwap(uint256 encodedSwap, uint40 providerIndex) external {
    uint200 postedSwap = _postedSwaps[encodedSwap];
    require(postedSwap != 0, "Swap does not exist");
    require(uint40(postedSwap) == 0, "Swap bonded to another provider");

    _postedSwaps[encodedSwap] = postedSwap | providerIndex;
    emit SwapBonded(encodedSwap);
  }

  /// @notice Cancel a swap. The swap initiator can call this method to withdraw funds
  /// from an expired swap request.
  /// @dev Designed to be used by swap initiators
  /// @param encodedSwap Encoded swap information; also used as the key of `_postedSwaps`
  function cancelSwap(uint256 encodedSwap) external {
    uint200 postedSwap = _postedSwaps[encodedSwap];
    require(postedSwap > 1, "Swap does not exist");
    require((encodedSwap >> 48 & 0xFFFFFFFFFF) < block.timestamp, "Swap is still locked");
    
    _postedSwaps[encodedSwap] = 0; // Swap expired so the same one cannot be posted again

    _safeTransfer(
      _tokenList[uint8(encodedSwap)], // tokenIndex -> token address
      address(uint160(postedSwap >> 40)), // initiator
      encodedSwap >> 160
    );

    emit SwapCancelled(encodedSwap);
  }

  /// @notice Execute the swap by providing a release signature.
  /// This is step 4️⃣  in a swap.
  /// Once the signature is verified, the current bonding LP (provider)
  /// will receive funds deposited by the swap initiator.
  /// @dev Designed to be used by the current bonding LP
  /// @param encodedSwap Encoded swap information; also used as the key of `_postedSwaps`
  /// @param recipientHash The keccak256 hash of the recipient address
  /// @param r Part of the release signature (same as in the `release` call)
  /// @param s Part of the release signature (same as in the `release` call)
  /// @param v Part of the release signature (same as in the `release` call)
  /// @param depositToPool Choose to deposit funds to the pool (will save gas)
  function executeSwap(
    uint256 encodedSwap,
    bytes32 recipientHash,
    bytes32 r,
    bytes32 s,
    uint8 v,
    bool depositToPool
  ) external {
    uint200 postedSwap = _postedSwaps[encodedSwap];
    require(postedSwap != 0, "Swap does not exist");

    if (((encodedSwap >> 48) & 0xFFFFFFFFFF) < block.timestamp + MIN_BOND_TIME_PERIOD) {
      // Swap expiredTs < current + MIN_BOND_TIME_PERIOD
      // The swap cannot be posted again and therefore safe to remove it
      // LPs who execute in this mode can save ~5000 gas
      _postedSwaps[encodedSwap] = 0;
    } else {
      // 1 will prevent the same swap to be posted again
      _postedSwaps[encodedSwap] = 1;
    }

    // TODO: fee to meson protocol

    _checkReleaseSignature(encodedSwap, recipientHash, r, s, v, address(uint160(postedSwap >> 40)));

    if (depositToPool) {
      uint48 balanceIndex = uint48(encodedSwap << 40) | uint40(postedSwap); // TODO: check
      _tokenBalanceOf[balanceIndex] = LowGasSafeMath.add(_tokenBalanceOf[balanceIndex], encodedSwap >> 160);
    } else {
      _safeTransfer(
        _tokenList[uint8(encodedSwap)], // tokenIndex -> token address
        addressOfIndex[uint40(postedSwap)], // providerIndex -> provider address
        encodedSwap >> 160
      );
    }
  }

  /// @notice Read information for a posted swap
  function getPostedSwap(uint256 encodedSwap) external view
    returns (address initiator, address provider, bool executed)
  {
    uint200 postedSwap = _postedSwaps[encodedSwap];
    initiator = address(uint160(postedSwap >> 40));
    executed = postedSwap == 1;
    if (postedSwap >> 40 == 0) {
      provider = address(0);
    } else {
      provider = addressOfIndex[uint40(postedSwap)];
    }
  }

  modifier forInitialChain(uint256 encodedSwap) {
    require(uint16(encodedSwap >> 8) == SHORT_COIN_TYPE, "Swap not for this chain");
    _;
  }
}
