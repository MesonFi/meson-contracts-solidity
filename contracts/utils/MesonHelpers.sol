// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "../MesonConfig.sol";
import "../interfaces/IERC20Minimal.sol";

/// @title MesonHelpers
contract MesonHelpers is MesonConfig {
  bytes32 internal constant EIP712_DOMAIN_TYPEHASH =
    keccak256(bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));

  bytes32 internal DOMAIN_SEPARATOR ;

  bytes32 internal constant SWAP_REQUEST_TYPEHASH =
    keccak256(bytes("SwapRequest(bytes inToken,uint256 amount,uint64 expireTs,bytes4 outChain,bytes outToken)"));

  bytes32 internal constant SWAP_RELEASE_TYPEHASH = keccak256(bytes("SwapRelease(bytes32 swapId,bytes recipient)"));

  bytes4 private constant ERC20_TRANSFER_SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));

  struct Swap {
    bytes32 id;
    uint256 metaAmount;
    uint64 ts;
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

  /// @notice Execute the token transfer transaction
  function _unsafeDepositToken(
    address token,
    address sender,
    uint256 amount
  ) internal {
    IERC20Minimal(token).transferFrom(sender, address(this), amount);
  }

  function _decodeSwapInput(bytes memory encodedSwap) internal pure returns (uint64, bytes32, uint256) {
    (bytes32 typehash, bytes32 inTokenHash, uint256 amount, uint64 expireTs, ,) =
      abi.decode(encodedSwap, (bytes32, bytes32, uint256, uint64, bytes4, bytes32));
    require(typehash == SWAP_REQUEST_TYPEHASH, "Invalid swap request typehash");
    return (expireTs, inTokenHash, amount);
  }

  function _decodeSwapOutput(bytes memory encodedSwap) internal pure returns (uint256, bytes32) {
    (bytes32 typehash, , uint256 amount, , , bytes32 outTokenHash) =
      abi.decode(encodedSwap, (bytes32, bytes32, uint256, uint64, bytes4, bytes32));
    require(typehash == SWAP_REQUEST_TYPEHASH, "Invalid swap request typehash");
    return (amount, outTokenHash);
  }

  function _getSwapId(bytes memory encodedSwap) internal view returns (bytes32) {
    bytes32 swapHash = keccak256(encodedSwap);
    return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, swapHash));
  }

  function _checkReleaseSignature(
    bytes32 swapId,
    bytes32 recipientHash,
    bytes32 domainHash,
    address signer,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) internal pure {
    require(signer != address(0), "signer cannot be empty address");
    bytes32 releaseHash = keccak256(abi.encode(SWAP_RELEASE_TYPEHASH, swapId, recipientHash));
    bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainHash, releaseHash));
    require(signer == ecrecover(digest, v, r, s), "invalid signature");
  }

  function getCoinType() external pure returns (bytes4) {
    return COIN_TYPE;
  }
}
