import type { BytesLike } from '@ethersproject/bytes'
import type { Signature } from './SwapSigner'

import { SwapSigner } from './SwapSigner'
import { SwapRequest, SwapRequestData } from './SwapRequest'

export interface SignedSwapCommonData {
  initiator: BytesLike,
  chainId: number,
  mesonAddress: string,
  signature: Signature,
}

export interface SignedSwapRequestData extends SwapRequestData, SignedSwapCommonData {
  swapId: string,
}

export interface SignedSwapReleaseData extends SignedSwapCommonData {
  swapId: string,
  recipient: string,
  domainHash: string,
}

export class SignedSwapRequest extends SwapRequest {
  readonly signer: SwapSigner
  readonly swapId: string
  readonly chainId: number
  readonly mesonAddress: string
  readonly initiator: BytesLike
  readonly signature: Signature

  static FromSerialized (json: string) {
    let parsed: SignedSwapRequestData
    try {
      parsed = JSON.parse(json)
    } catch {
      throw new Error('Invalid json string')
    }
    return new SignedSwapRequest(parsed)
  }

  constructor (signedReq: SignedSwapRequestData) {
    if (!signedReq.chainId) {
      throw new Error('Missing chain id')
    } else if (!signedReq.mesonAddress) {
      throw new Error('Missing meson contract address')
    } else if (!signedReq.initiator) {
      throw new Error('Missing initiator')
    } else if (!signedReq.signature) {
      throw new Error('Missing signature')
    }

    const signer = new SwapSigner(signedReq.mesonAddress, signedReq.chainId)
    const recovered = signer.recoverFromRequestSignature(signedReq)
    if (recovered !== signedReq.initiator) {
      throw new Error('Invalid signature')
    }

    super(signedReq)
    this.signer = signer
    this.swapId = signer.getSwapId(this)
    this.chainId = signedReq.chainId
    this.mesonAddress = signedReq.mesonAddress
    this.initiator = signedReq.initiator
    this.signature = signedReq.signature
  }

  static CheckReleaseSignature (signedRelease: SignedSwapReleaseData) {
    const signer = new SwapSigner(signedRelease.mesonAddress, signedRelease.chainId)
    const recovered = signer.recoverFromReleaseSignature(signedRelease)
    if (recovered !== signedRelease.initiator) {
      throw new Error('Invalid signature')
    }
  }
}
