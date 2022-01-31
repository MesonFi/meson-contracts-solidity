import type { Wallet } from '@ethersproject/wallet'
import type { TypedDataDomain } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'

import { SwapRequest } from './SwapRequest'
import { SignedSwapReleaseData } from './SignedSwap'

const SWAP_REQUEST_TYPE = {
  SwapRequest: [
    { name: 'encoded', type: 'uint256' },
  ]
}

const SWAP_RELEASE_TYPE = {
  SwapRelease: [
    { name: 'swapId', type: 'bytes32' },
    { name: 'recipient', type: 'bytes' },
  ]
}

interface MesonTypedDataDomain extends TypedDataDomain {
  chainId: number;
  verifyingContract: string;
}

export type Signature = [string, string, number]

export class SwapSigner {
  readonly domain: MesonTypedDataDomain

  constructor(mesonAddress: string, chainId: number) {
    this.domain = {
      name: 'Meson Fi',
      version: '1',
      chainId,
      verifyingContract: mesonAddress
    }
  }

  get chainId(): number {
    return Number(this.domain.chainId)
  }

  get mesonAddress(): string {
    return this.domain.verifyingContract
  }

  getDomainHash(): string {
    return _TypedDataEncoder.hashDomain(this.domain)
  }

  async signSwapRequest(swap: SwapRequest, wallet: Wallet): Promise<Signature> {
    const signature = await wallet._signTypedData(this.domain, SWAP_REQUEST_TYPE, { encoded: swap.encode() })
    return this._separateSignature(signature)
  }

  async signSwapRelease(swapId: string, recipient: string, wallet: Wallet): Promise<Signature> {
    const signature = await wallet._signTypedData(this.domain, SWAP_RELEASE_TYPE, { swapId, recipient })
    return this._separateSignature(signature)
  }

  private _separateSignature(signature: string): Signature {
    const r = '0x' + signature.substring(2, 66)
    const s = '0x' + signature.substring(66, 130)
    const v = parseInt(signature.substring(130, 132), 16)
    return [r, s, v]
  }

  hashRequest(encoded: string): string {
    return _TypedDataEncoder.hash(this.domain, SWAP_REQUEST_TYPE, { encoded })
  }

  hashRelease(swapRelease: SignedSwapReleaseData): string {
    return _TypedDataEncoder.hash(this.domain, SWAP_RELEASE_TYPE, swapRelease)
  }
}
