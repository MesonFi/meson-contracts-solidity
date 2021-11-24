import { ethers } from 'hardhat'

const { joinSignature, solidityKeccak256 } = ethers.utils

// default mnemonic for hardhat network
const mnemonic = 'test test test test test test test test test test test junk'
export const wallet = ethers.Wallet.fromMnemonic(mnemonic)

export type Swap = {
  inToken: string,
  outToken: string,
  chain: string,
  receiver: string,
  amount: number,
}

export function getSwapId(swap: Swap) {
  return solidityKeccak256(
    ["bytes", "string", "bytes4", "string", "bytes", "string", "bytes", "string", "uint256"],
    [swap.inToken, ":", swap.chain, ":", swap.outToken, ":", swap.receiver, ":", swap.amount]
  )
}

export function getSwapHash(swapId: string, epoch: number) {
  return solidityKeccak256(
    ["bytes32", "string", "uint256"],
    [swapId, ":", epoch]
  )
}

export function signSwap(swap: Swap, epoch: number) {
  const swapId = getSwapId(swap)
  const swapHash = getSwapHash(swapId, epoch)
  return joinSignature(wallet._signingKey().signDigest(swapHash))
}
