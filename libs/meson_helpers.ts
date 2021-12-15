import { ethers, BytesLike, Wallet } from 'ethers'

const { joinSignature, solidityKeccak256 } = ethers.utils

export type Swap = {
  inChain: BytesLike,
  inToken: BytesLike,
  outChain: BytesLike,
  outToken: BytesLike,
  receiver: BytesLike,
  amount: number,
  ts: number,
}

export function getSwapId(swap: Swap) {
  return solidityKeccak256(
    ['bytes4', 'string', 'bytes', 'string', 'bytes4', 'string', 'bytes', 'string', 'bytes', 'string', 'uint256', 'string', 'uint256'],
    [swap.inChain, ':', swap.inToken, ':', swap.outChain, ':', swap.outToken, ':', swap.receiver, ':', swap.amount, ':', swap.ts]
  )
}

export function getSwapHash(swapId: string, epoch: number) {
  return solidityKeccak256(
    ['bytes32', 'string', 'uint256'],
    [swapId, ':', epoch]
  )
}

export function signSwap(wallet: Wallet, swapId: string, epoch: number) {
  const swapHash = getSwapHash(swapId, epoch)
  return joinSignature(wallet._signingKey().signDigest(swapHash))
}
