import { Wallet } from '@ethersproject/wallet'
import { BytesLike } from '@ethersproject/bytes'
import { TypedDataDomain } from '@ethersproject/abstract-signer'

import { SwapRequestData, SWAP_REQUEST_TYPE, SWAP_RELEASE_TYPE } from './SwapRequest'

export class SwapSigner {
  readonly domain: TypedDataDomain

  constructor(mesonAddress: string) {
    this.domain = {
      name: 'Meson Fi',
      version: '1',
      verifyingContract: mesonAddress
    }
  }

  set chainId (id: number) {
    this.domain.chainId = id
  }

  async signSwapRequest(swap: SwapRequestData, wallet: Wallet) {
    const signature = await wallet._signTypedData(this.domain, SWAP_REQUEST_TYPE, swap)
    return this._separateSignature(signature)
  }

  async signSwapRelease(swapId: BytesLike, wallet: Wallet) {
    const signature = await wallet._signTypedData(this.domain, SWAP_RELEASE_TYPE, { swapId })
    return this._separateSignature(signature)
  }

  _separateSignature(signature: string) {
    const r = '0x' + signature.substring(2, 66)
    const s = '0x' + signature.substring(66, 130)
    const v = parseInt(signature.substring(130, 132), 16)
    return [r, s, v] as [BytesLike, BytesLike, number]
  }
}
