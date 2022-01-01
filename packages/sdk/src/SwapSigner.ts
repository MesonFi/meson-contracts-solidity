import { BytesLike, Wallet } from 'ethers'

import { SwapRequestData } from './SwapRequest'

const requestTypes = {
  SwapRequest: [
    { name: 'expireTs', type: 'uint256' },
    { name: 'inToken', type: 'bytes' },
    { name: 'amount', type: 'uint256' },
    { name: 'outChain', type: 'bytes4' },
    { name: 'outToken', type: 'bytes' },
    { name: 'recipient', type: 'bytes' }
  ]
}

const releaseTypes = {
  SwapRelease: [{ name: 'swapId', type: 'bytes32' }]
}

export class SwapSigner {
  _domain: any

  constructor(mesonAddress: BytesLike, chainId: BytesLike) {
    this._domain = {
      name: 'Meson Fi',
      version: '1',
      chainId,
      verifyingContract: mesonAddress
    }
  }

  async signSwapRequest(swap: SwapRequestData, wallet: Wallet) {
    const signature = await wallet._signTypedData(this._domain, requestTypes, swap)
    return this._separateSignature(signature)
  }

  async signSwapRelease(swapId: BytesLike, wallet: Wallet) {
    const signature = await wallet._signTypedData(this._domain, releaseTypes, { swapId })
    return this._separateSignature(signature)
  }

  _separateSignature(signature: BytesLike) {
    const r = '0x' + signature.substring(2, 66)
    const s = '0x' + signature.substring(66, 130)
    const v = parseInt(signature.substring(130, 132), 16)
    return { r, s, v }
  }
}
