import { ethers } from 'hardhat'

const { concat, toUtf8Bytes, keccak256, joinSignature } = ethers.utils

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
const bytes = concat([
    toUtf8Bytes(`${swap.inToken}:ETH:`),
    swap.outToken,
    toUtf8Bytes(':'),
    swap.receiver,
    toUtf8Bytes(`:${swap.amount}`)
  ])
  return keccak256(bytes)
}

export function signSwap(swap: Swap, epoch: number) {
  const msg = concat([getSwapId(swap), toUtf8Bytes(`:${epoch}`)])
  const swapHash = keccak256(msg)

  return joinSignature(wallet._signingKey().signDigest(swapHash))
}
