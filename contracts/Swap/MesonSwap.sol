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
  /// @notice swap requests by swapIds, in format of `initiator:uint160|providerIndex:uint40`
  mapping(bytes32 => uint200) internal _swapRequests;

  /// @notice xxxx
  /// @dev Designed to be used by users
  /// @param encodedSwap Packed in format of `amount:uint128|fee:uint40|expireTs:uint40|outChain:bytes4|outToken:uint8|inToken:uint8` to save gas
  function requestSwap(uint256 encodedSwap) external {
    bytes32 swapId = _getSwapId(encodedSwap, DOMAIN_SEPARATOR);
    require(_swapRequests[swapId] == 0, "Swap already exists");

    address initiator = _msgSender();
    _swapRequests[swapId] = uint200(uint160(initiator)) << 40;

    (uint256 amountWithFee, address inToken) = _checkSwapRequest(encodedSwap);
    _unsafeDepositToken(inToken, initiator, amountWithFee);
    
    emit SwapRequested(swapId);
  }

  /// @notice xxxx
  /// @dev Designed to be used by LPs

  function bondSwap(bytes32 swapId, uint40 providerIndex) external {
    uint200 req = _swapRequests[swapId];
    require(req != 0, "Swap does not exist");
    require(uint40(req) == 0, "Swap bonded to another provider");

    _swapRequests[swapId] = req | providerIndex;
    emit SwapBonded(swapId);
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
  /// @param encodedSwap The packed swap
  /// @param r Part of the signature
  /// @param s Part of the signature
  /// @param packedData Packed in format of `v:uint8|initiator:address|providerIndex:uint40` to save gas
  function postSwap(uint256 encodedSwap, bytes32 r, bytes32 s, uint208 packedData) external {
    bytes32 swapId = _getSwapId(encodedSwap, DOMAIN_SEPARATOR);
    require(_swapRequests[swapId] == 0, "Swap already exists");

    uint8 v;
    address initiator;
    uint200 req;
    assembly {
      mstore(32, packedData) // store packedData@[38:64] where v@38, initiator@[39:59) & providerIndex@[59:64)
      v := mload(7) // load v@38
      initiator := mload(27) // load initiator@[39:59)
      req := mload(32) // load [39:64) which is initiator|providerIndex
    }

    require(initiator == ecrecover(swapId, v, r, s), "Invalid signature");

    _swapRequests[swapId] = req;
    (uint256 amountWithFee, address inToken) = _checkSwapRequest(encodedSwap);
    _unsafeDepositToken(inToken, initiator, amountWithFee);

    emit SwapPosted(swapId);
  }

  /// @notice xxxx
  /// @dev Designed to be used by users
  /// @param encodedSwap The abi encoded swap
  function _checkSwapRequest(uint256 encodedSwap) internal view
    returns (uint256 amountWithFee, address inToken)
  {
    amountWithFee = encodedSwap >> 128;
    require(amountWithFee > 0, "Swap amount must be greater than zero");
    
    inToken = _tokenList[uint8(encodedSwap)];

    uint40 expireTs = uint40(encodedSwap >> 48);
    uint40 ts = uint40(block.timestamp);
    require(expireTs > ts + MIN_BOND_TIME_PERIOD, "Expire ts too early");
    require(expireTs < ts + MAX_BOND_TIME_PERIOD, "Expire ts too late");
  }

  /// @notice Cancel a swap
  /// @dev Designed to be used by users
  /// @param encodedSwap The abi encoded swap
  function cancelSwap(uint256 encodedSwap) external {
    bytes32 swapId = _getSwapId(encodedSwap, DOMAIN_SEPARATOR);
    uint200 req = _swapRequests[swapId];

    require(req != 0, "Swap does not exist");
    require(uint40(encodedSwap >> 48) < uint40(block.timestamp), "Swap is still locked");
    
    address initiator = address(uint160(req >> 40));
    address inToken = _tokenList[uint8(encodedSwap)];

    _swapRequests[swapId] = 0;

    _safeTransfer(inToken, initiator, encodedSwap >> 128);

    emit SwapCancelled(swapId);
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
  /// @param encodedSwap The abi encoded swap
  function executeSwap(
    uint256 encodedSwap,
    bytes32 recipientHash,
    bytes32 r,
    bytes32 s,
    uint8 v,
    bool depositToPool
  ) external {
    bytes32 domainSeparator = DOMAIN_SEPARATOR;
    bytes32 swapId = _getSwapId(encodedSwap, domainSeparator);
    uint200 req = _swapRequests[swapId]; // No check here. User should check it before sign for release

    // TODO: fee to meson protocol

    _swapRequests[swapId] = 0;

    if (depositToPool) {
      address initiator;
      uint128 amountWithFee;
      uint48 balanceIndex;
      assembly {
        mstore(21, req) // store req@[28-53) where initiator@[28-48) & providerIndex@[48-53)
        initiator := mload(16) // load initiator@[28-48)
        mstore(16, encodedSwap) // store encodedSwap@[16-48) where amount@[16-32) & inToken@47
        amountWithFee := mload(0) // load amount@[16-32)
        balanceIndex := mload(21) // load [47-53) which is inToken|providerIndex
      }
      _checkReleaseSignatureForHash(swapId, recipientHash, domainSeparator, r, s, v, initiator);
      _tokenBalanceOf[balanceIndex] = LowGasSafeMath.add(_tokenBalanceOf[balanceIndex], amountWithFee);
    } else {
      _checkReleaseSignatureForHash(swapId, recipientHash, domainSeparator, r, s, v,
        address(uint160(req >> 40)) // initiator
      );
      _safeTransfer(
        _tokenList[uint8(encodedSwap)], // tokenIndex -> token address
        addressOfIndex[uint40(req)], // providerIndex -> provider address
        encodedSwap >> 128
      );
    }

    emit SwapExecuted(swapId);
  }

  function getSwap(bytes32 swapId) external view returns (address initiator, address provider) {
    uint200 req = _swapRequests[swapId];
    provider = addressOfIndex[uint40(req)];
    initiator = address(uint160(req >> 40));
  }
}
