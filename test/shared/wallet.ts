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
    toUtf8Bytes(swap.inToken),
    toUtf8Bytes(`:ETH:`),
    swap.outToken,
    toUtf8Bytes(':'),
    swap.receiver,
    toUtf8Bytes(`:${swap.amount}`)
  ])
  return keccak256(bytes)
}

export function getSwapHash(swapId: string, epoch: number) {
  const msg = concat([swapId, toUtf8Bytes(`:${epoch}`)]);
  return keccak256(msg);
}

export function signSwap(swap: Swap, epoch: number) {
  const swapId = getSwapId(swap);
  const swapHash = getSwapHash(swapId, epoch);
  return joinSignature(wallet._signingKey().signDigest(swapHash))
}
