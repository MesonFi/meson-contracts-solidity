import type { Wallet } from '@ethersproject/wallet'
import type { TypedDataDomain } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { recoverAddress } from '@ethersproject/transactions'

import { SwapRequestData, SWAP_REQUEST_TYPE, SWAP_RELEASE_TYPE } from './SwapRequest'
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwapRequest'

export class SwapSigner {
  readonly domain: TypedDataDomain

  constructor(mesonAddress: string, chainId: number) {
    this.domain = {
      name: 'Meson Fi',
      version: '1',
      chainId,
      verifyingContract: mesonAddress
    }
  }

  get chainId() {
    return this.domain.chainId
  }

  get mesonAddress() {
    return this.domain.verifyingContract
  }

  getDomainHash() {
    return _TypedDataEncoder.hashDomain(this.domain)
  }

  async signSwapRequest(swap: SwapRequestData, wallet: Wallet) {
    const signature = await wallet._signTypedData(this.domain, SWAP_REQUEST_TYPE, swap)
    return this._separateSignature(signature)
  }

  async signSwapRelease(swapId: string, recipient: string, wallet: Wallet) {
    const signature = await wallet._signTypedData(this.domain, SWAP_RELEASE_TYPE, { swapId, recipient })
    return this._separateSignature(signature)
  }

  private _separateSignature(signature: string) {
    const r = '0x' + signature.substring(2, 66)
    const s = '0x' + signature.substring(66, 130)
    const v = parseInt(signature.substring(130, 132), 16)
    return [r, s, v] as [string, string, number]
  }

  getSwapId(swap: SwapRequestData) {
    return _TypedDataEncoder.hash(this.domain, SWAP_REQUEST_TYPE, swap)
  }

  recoverFromRequestSignature(swap: SignedSwapRequestData) {
    const [r, s, v] = swap.signature
    return recoverAddress(this.getSwapId(swap), { r, s, v }).toLowerCase()
  }

  recoverFromReleaseSignature(release: SignedSwapReleaseData) {
    const digest = _TypedDataEncoder.hash(this.domain, SWAP_RELEASE_TYPE, release)
    const [r, s, v] = release.signature
    return recoverAddress(digest, { r, s, v }).toLowerCase()
  }
}
