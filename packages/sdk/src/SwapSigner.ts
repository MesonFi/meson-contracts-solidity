import { Wallet } from '@ethersproject/wallet'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { keccak256 } from '@ethersproject/keccak256'
import { recoverAddress } from '@ethersproject/transactions'
import { hexConcat, BytesLike } from '@ethersproject/bytes'
import { TypedDataDomain } from '@ethersproject/abstract-signer'

import { SwapRequestData, SWAP_REQUEST_TYPE, SWAP_RELEASE_TYPE } from './SwapRequest'

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

  async signSwapRequest(swap: SwapRequestData, wallet: Wallet) {
    const signature = await wallet._signTypedData(this.domain, SWAP_REQUEST_TYPE, swap)
    return this._separateSignature(signature)
  }

  async signSwapRelease(swapId: string, wallet: Wallet) {
    const signature = await wallet._signTypedData(this.domain, SWAP_RELEASE_TYPE, { swapId })
    return this._separateSignature(signature)
  }

  private _separateSignature(signature: string) {
    const r = '0x' + signature.substring(2, 66)
    const s = '0x' + signature.substring(66, 130)
    const v = parseInt(signature.substring(130, 132), 16)
    return [r, s, v] as [string, string, number]
  }

  getSwapId(swap: SwapRequestData) {
    return keccak256(hexConcat([
      '0x1901',
      _TypedDataEncoder.hashDomain(this.domain),
      _TypedDataEncoder.from(SWAP_REQUEST_TYPE).hash(swap)
    ]))
  }

  recoverFromRequestSignature(swap: SwapRequestData, [r, s, v]: [string, string, number]) {
    return recoverAddress(this.getSwapId(swap), { r, s, v }).toLowerCase()
  }

  recoverFromReleaseSignature(swapId: BytesLike, [r, s, v]: [string, string, number]) {
    const digest = keccak256(hexConcat([
      '0x1901',
      _TypedDataEncoder.hashDomain(this.domain),
      _TypedDataEncoder.from(SWAP_RELEASE_TYPE).hash({ swapId })
    ]))
    return recoverAddress(digest, { r, s, v }).toLowerCase()
  }
}
