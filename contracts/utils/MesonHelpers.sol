// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../MesonConfig.sol";
import "../interfaces/IERC20Minimal.sol";

/// @title MesonHelpers
contract MesonHelpers is MesonConfig {
  bytes32 internal constant EIP712_DOMAIN_TYPEHASH =
    keccak256(bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));

  bytes32 internal DOMAIN_SEPARATOR;

  bytes32 internal constant SWAP_REQUEST_TYPEHASH = keccak256(bytes("SwapRequest(uint256 encoded)"));

  //uint128 amount,uint40 fee,uint40 expireTs,uint8 inToken,bytes4 outChain,uint8 outToken

  bytes32 internal constant SWAP_RELEASE_TYPEHASH = keccak256(bytes("SwapRelease(bytes32 swapId,bytes recipient)"));

  bytes4 private constant ERC20_TRANSFER_SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));

  /// @notice Safe transfers tokens from msg.sender to a recipient
  /// for interacting with ERC20 tokens that do not consistently return true/false
  /// @param token The contract address of the token which will be transferred
  /// @param recipient The recipient of the transfer
  /// @param amount The value of the transfer
  function _safeTransfer(
    address token,
    address recipient,
    uint256 amount
  ) internal {
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(ERC20_TRANSFER_SELECTOR, recipient, amount));
    require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
  }

  /// @notice Execute the token transfer transaction
  function _unsafeDepositToken(
    address token,
    address sender,
    uint256 amount
  ) internal {
    IERC20Minimal(token).transferFrom(sender, address(this), amount);
  }

  function _getSwapId(uint256 encodedSwap, bytes32 domainHash) internal pure returns (bytes32 swapId) {
    bytes32 typeHash = SWAP_REQUEST_TYPEHASH;
    assembly {
      let ptr := mload(0x40)

      // same as hash = keccak256(abi.encodePacked(typeHash, encodedSwap))
      mstore(0, typeHash)
      mstore(0x20, encodedSwap)
      mstore(0x22, keccak256(0, 0x40))

      // same as digest = keccak256(abi.encodePacked(0x1901, domainHash, hash))
      mstore8(0, 0x19)
      mstore8(1, 0x01)
      mstore(2, domainHash)
      swapId := keccak256(0, 0x42)
      mstore(0x40, ptr)
    }
  }

  function _checkReleaseSignature(
    bytes32 swapId,
    address recipient,
    bytes32 domainHash,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) internal pure {
    bytes32 typeHash = SWAP_RELEASE_TYPEHASH;
    require(signer != address(0), "Signer cannot be empty address");
    bytes32 digest;
    assembly {
      let ptr := mload(0x40)

      // same as recipientHash = keccak256(recipient)
      mstore(0, recipient)
      mstore(0x40, keccak256(12, 20))

      // same as hash = keccak256(abi.encodePacked(typeHash, swapId, recipientHash))
      mstore(0, typeHash)
      mstore(0x20, swapId)
      mstore(0x22, keccak256(0, 0x60))
      
      // same as digest = keccak256(abi.encodePacked(0x1901, domainHash, hash))
      mstore8(0, 0x19)
      mstore8(1, 0x01)
      mstore(2, domainHash)
      digest := keccak256(0, 0x42)
      
      mstore(0x40, ptr)
    }
    require(signer == ecrecover(digest, v, r, s), "Invalid signature");
  }

  function _checkReleaseSignatureForHash(
    bytes32 swapId,
    bytes32 recipientHash,
    bytes32 domainHash,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address signer
  ) internal pure {
    bytes32 typeHash = SWAP_RELEASE_TYPEHASH;
    require(signer != address(0), "Signer cannot be empty address");
    bytes32 digest;
    assembly {
      let ptr := mload(0x40)

      // same as hash = keccak256(abi.encodePacked(typeHash, swapId, recipientHash))
      mstore(0, typeHash)
      mstore(0x20, swapId)
      mstore(0x40, recipientHash)
      mstore(0x22, keccak256(0, 0x60))
      
      // same as digest = keccak256(abi.encodePacked(0x1901, domainHash, hash))
      mstore8(0, 0x19)
      mstore8(1, 0x01)
      mstore(2, domainHash)
      digest := keccak256(0, 0x42)
      
      mstore(0x40, ptr)
    }
    require(signer == ecrecover(digest, v, r, s), "Invalid signature");
  }

  function getCoinType() external pure returns (bytes4) {
    return COIN_TYPE;
  }

  function _msgSender() internal view returns (address) {
    return msg.sender;
  }

  function _msgData() internal pure returns (bytes calldata) {
    return msg.data;
  }
}
