// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "./IMesonSwapEvents.sol";
import "../utils/MesonStates.sol";

/// @title MesonSwap
/// @notice The class to receive and process swap requests.
/// Methods in this class will be executed by swap initiators or LPs
/// on the initial chain of swaps.
contract MesonSwap is IMesonSwapEvents, MesonStates {
  /// @notice Posted Swaps
  /// key: encodedSwap in format of `amount:uint48|salt:uint80|fee:uint40|expireTs:uint40|outChain:uint16|outToken:uint8|inChain:uint16|inToken:uint8`
  /// value: in format of initiator:uint160|poolIndex:uint40; =1 maybe means executed (to prevent replay attack)

  /// TODO define variables, same as MesonPools.sol
  /// uint160 = address
  /// poolIndex: see xxx for definition
  mapping(uint256 => uint200) internal _postedSwaps;

  /// @notice Anyone can call this method to post a swap request. This is step 1️⃣  in a swap.
  /// The r,s,v signature must be signed by the swap initiator. The initiator can call
  /// this method directly, in which case `poolIndex` should be zero and wait for LPs
  /// to call `bondSwap`. Initiators can also send the swap requests offchain (through the
  /// meson relayer service). An LP who receives requests through the relayer
  /// can call this method to post and bond the swap in a single contract execution,
  /// in which case he should give his own `poolIndex`.
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
  /// @param postingValue In format of `initiator:address|poolIndex:uint40` to save gas
  function postSwap(uint256 encodedSwap, bytes32 r, bytes32 s, uint8 v, uint200 postingValue)
    external forInitialChain(encodedSwap)
  {
    require(_postedSwaps[encodedSwap] == 0, "Swap already exists");

    uint256 amount = _amountFrom(encodedSwap);
    require(amount <= 1e11, "For security reason, amount cannot be greater than 100k");

    uint256 delta = _expireTsFrom(encodedSwap) - block.timestamp;
    // Underflow would trigger "Expire ts too late" error
    require(delta > MIN_BOND_TIME_PERIOD, "Expire ts too early");
    require(delta < MAX_BOND_TIME_PERIOD, "Expire ts too late");

    address initiator = _initiatorFromPosted(postingValue);
    _checkRequestSignature(encodedSwap, r, s, v, initiator);
    _postedSwaps[encodedSwap] = postingValue;

    uint8 tokenIndex = _inTokenIndexFrom(encodedSwap);
    _unsafeDepositToken(
      _tokenList[tokenIndex],
      initiator,
      amount,
      tokenIndex == 255
    );

    emit SwapPosted(encodedSwap);
  }

  /// @notice If `postSwap` is called by the initiator of the swap and `poolIndex`
  /// is zero, an LP can call this to bond the swap to himself.
  /// @dev Designed to be used by LPs
  /// @param encodedSwap Encoded swap information; also used as the key of `_postedSwaps`
  /// @param poolIndex An index for the LP; call `depositAndRegister` to get an index
  function bondSwap(uint256 encodedSwap, uint40 poolIndex) external {
    uint200 postedSwap = _postedSwaps[encodedSwap];
    require(postedSwap > 1, "Swap does not exist");
    require(_poolIndexFromPosted(postedSwap) == 0, "Swap bonded to another pool");
    require(poolOfAuthorizedAddr[msg.sender] == poolIndex, "Can only bound to signer");

    _postedSwaps[encodedSwap] = postedSwap | poolIndex;
    emit SwapBonded(encodedSwap);
  }

  /// @notice Cancel a swap. The swap initiator can call this method to withdraw funds
  /// from an expired swap request.
  /// @dev Designed to be used by swap initiators
  /// @param encodedSwap Encoded swap information; also used as the key of `_postedSwaps`
  function cancelSwap(uint256 encodedSwap) external {
    uint200 postedSwap = _postedSwaps[encodedSwap];
    require(postedSwap > 1, "Swap does not exist");
    require(_expireTsFrom(encodedSwap) < block.timestamp, "Swap is still locked");

    _postedSwaps[encodedSwap] = 0; // Swap expired so the same one cannot be posted again

    uint8 tokenIndex = _inTokenIndexFrom(encodedSwap);
    _safeTransfer(
      _tokenList[tokenIndex],
      _initiatorFromPosted(postedSwap),
      _amountFrom(encodedSwap),
      tokenIndex == 255
    );

    emit SwapCancelled(encodedSwap);
  }

  /// @notice Execute the swap by providing a release signature.
  /// This is step 4️⃣  in a swap.
  /// Once the signature is verified, the current bonding LP pool
  /// will receive funds deposited by the swap initiator.
  /// @dev Designed to be used by the current bonding LP
  /// @param encodedSwap Encoded swap information; also used as the key of `_postedSwaps`
  /// @param r Part of the release signature (same as in the `release` call)
  /// @param s Part of the release signature (same as in the `release` call)
  /// @param v Part of the release signature (same as in the `release` call)
  /// @param recipient The recipient address of the swap
  /// @param depositToPool Choose to deposit funds to the pool (will save gas)
  function executeSwap(
    uint256 encodedSwap,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address recipient,
    bool depositToPool
  ) external {
    uint200 postedSwap = _postedSwaps[encodedSwap];
    require(postedSwap > 1, "Swap does not exist");

    if (_expireTsFrom(encodedSwap) < block.timestamp + MIN_BOND_TIME_PERIOD) {
      // Swap expiredTs < current + MIN_BOND_TIME_PERIOD
      // The swap cannot be posted again and therefore safe to remove it
      // LPs who execute in this mode can save ~5000 gas
      _postedSwaps[encodedSwap] = 0;
    } else {
      // 1 will prevent the same swap to be posted again
      _postedSwaps[encodedSwap] = 1;
    }

    _checkReleaseSignature(encodedSwap, recipient, r, s, v, _initiatorFromPosted(postedSwap));

    uint8 tokenIndex = _inTokenIndexFrom(encodedSwap);
    uint40 poolIndex = _poolIndexFromPosted(postedSwap);
    if (depositToPool) {
      _balanceOfPoolToken[_poolTokenIndexFrom(tokenIndex, poolIndex)] += _amountFrom(encodedSwap);
    } else {
      _safeTransfer(_tokenList[tokenIndex], ownerOfPool[poolIndex], _amountFrom(encodedSwap), tokenIndex == 255);
    }
  }

  /// @notice Read information for a posted swap
  function getPostedSwap(uint256 encodedSwap) external view
    returns (address initiator, address poolOwner, bool executed)
  {
    uint200 postedSwap = _postedSwaps[encodedSwap];
    initiator = _initiatorFromPosted(postedSwap);
    executed = postedSwap == 1;
    if (initiator == address(0)) {
      poolOwner = address(0);
    } else {
      poolOwner = ownerOfPool[_poolIndexFromPosted(postedSwap)];
    }
  }

  modifier forInitialChain(uint256 encodedSwap) {
    require(_inChainFrom(encodedSwap) == SHORT_COIN_TYPE, "Swap not for this chain");
    _;
  }
}
