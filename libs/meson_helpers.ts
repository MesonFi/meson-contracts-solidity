import { ethers, BytesLike, Wallet } from 'ethers'

const { id, keccak256, defaultAbiCoder } = ethers.utils

export type Swap = {
  expireTs: number,
  inToken: BytesLike,
  amount: number,
  outChain: BytesLike,
  outToken: BytesLike,
  recipient: BytesLike,
}

export function encodeSwap(swap: Swap) {
  const typehash = id('SwapRequest(uint256 expireTs,bytes inToken,uint256 amount,bytes4 outChain,bytes outToken,bytes recipient)')
  return defaultAbiCoder.encode(
    ['bytes32', 'uint256', 'bytes32', 'uint256', 'bytes4', 'bytes32', 'bytes32'],
    [typehash, swap.expireTs, keccak256(swap.inToken), swap.amount, swap.outChain, keccak256(swap.outToken), keccak256(swap.recipient)]
  )
}

export function getSwapId(swap: Swap) {
  return keccak256(encodeSwap(swap))
}

export class TypedSigner {
  _domain: any

  constructor (verifyingContract: BytesLike, chainId: number) {
    this._domain = {
      name: 'Meson Fi',
      version: '1',
      chainId,
      verifyingContract
    }
  }

  async signSwapRequest (swap: Swap, wallet: Wallet) {
    const types = {
      SwapRequest: [
        { name: 'expireTs', type: 'uint256' },
        { name: 'inToken', type: 'bytes' },
        { name: 'amount', type: 'uint256' },
        { name: 'outChain', type: 'bytes4' },
        { name: 'outToken', type: 'bytes' },
        { name: 'recipient', type: 'bytes' }
      ]
    }

    const signature = await wallet._signTypedData(this._domain, types, swap)
    return this._separateSignature(signature)
  }

  async signSwapRelease (swapId: BytesLike, wallet: Wallet) {
    const types = {
      SwapRelease: [{ name: 'swapId', type: 'bytes32' }]
    }

    const signature = await wallet._signTypedData(this._domain, types, { swapId })
    return this._separateSignature(signature)
  }

  _separateSignature (signature: BytesLike) {
    const r = '0x' + signature.substring(2, 66)
    const s = '0x' + signature.substring(66, 130)
    const v = parseInt(signature.substring(130, 132), 16)
    return { r, s, v }
  }
}
