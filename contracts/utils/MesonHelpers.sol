// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "../MesonConfig.sol";

/// @title MesonHelpers
contract MesonHelpers is MesonConfig {
  bytes32 internal constant EIP712_DOMAIN_TYPEHASH =
    keccak256(bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));

  bytes32 internal DOMAIN_SEPARATOR =
    keccak256(
      abi.encode(
        EIP712_DOMAIN_TYPEHASH,
        keccak256(bytes("Meson Fi")),
        keccak256(bytes("1")),
        3, // Ropstan chain ID
        address(this)
      )
    );

  bytes32 internal constant SWAP_REQUEST_TYPEHASH =
    keccak256(bytes("SwapRequest(uint256 expireTs,bytes inToken,uint256 amount,bytes4 outChain,bytes outToken,bytes recipient)"));

  bytes32 internal constant SWAP_RELEASE_TYPEHASH = keccak256(bytes("SwapRelease(bytes32 swapId)"));

  bytes4 private constant ERC20_TRANSFER_SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));

  struct EIP712Domain {
    string name;
    string version;
    uint256 chainId;
    address verifyingContract;
  }

  struct Swap {
    bytes32 id;
    uint256 metaAmount;
    uint256 ts;
  }

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
    require(success && (data.length == 0 || abi.decode(data, (bool))), "transfer failed");
  }

  /// @notice Get ID for a swap on the chain the swap is initiated
  function _getSwapId(
    uint256 expireTs,
    address inToken,
    uint256 amount,
    bytes4 outChain,
    bytes memory outToken,
    bytes memory recipient
  ) internal pure returns (bytes32) {
    return
      keccak256(
        _encodeSwap(
          expireTs,
          abi.encodePacked(inToken),
          amount,
          outChain,
          outToken,
          recipient
        )
      );
  }

  function _encodeSwap(
    uint256 expireTs,
    bytes memory inToken,
    uint256 amount,
    bytes4 outChain,
    bytes memory outToken,
    bytes memory recipient
  ) internal pure returns (bytes memory) {
    return
      abi.encode(
        SWAP_REQUEST_TYPEHASH,
        expireTs,
        keccak256(inToken),
        amount,
        outChain,
        keccak256(outToken),
        keccak256(recipient)
      );
  }

  function _decodeSwap(bytes memory encodedSwap) internal pure returns (uint256, bytes32, uint256) {
    (bytes32 typehash, uint256 expireTs, bytes32 inTokenHash, uint256 amount, , ,) =
      abi.decode(encodedSwap, (bytes32, uint256, bytes32, uint256, bytes4, bytes32, bytes32));
    require(typehash == SWAP_REQUEST_TYPEHASH, "Invalid swap request typehash");

    // address inTokenAddr;
    // assembly {
    //   inTokenAddr := mload(add(inToken, 20))
    // }
    return (expireTs, inTokenHash, amount);
  }

  function _checkRequestSignature(
    bytes32 swapId,
    address signer,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) internal view {
    _checkSignature(swapId, signer, r, s, v);
  }

  function _checkReleaseSignature(
    bytes32 swapId,
    address signer,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) internal view {
    bytes32 hash = keccak256(abi.encode(SWAP_RELEASE_TYPEHASH, swapId));
    _checkSignature(hash, signer, r, s, v);
  }

  function _checkSignature(
    bytes32 hash,
    address signer,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) internal view {
    bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hash));
    require(signer != address(0), "signer cannot be empty address");
    require(signer == ecrecover(digest, v, r, s), "invalid signatures");
  }
}
