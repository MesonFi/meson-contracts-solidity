import type { BytesLike } from '@ethersproject/bytes'
import type { Signature } from './SwapSigner'

import { SwapSigner } from './SwapSigner'
import { SwapRequest, SwapRequestData } from './SwapRequest'

export interface SignedSwapCommonData {
  swapId: string,
  initiator: BytesLike,
  chainId: number,
  mesonAddress: string,
  signature: Signature,
}

export interface SignedSwapRequestData extends SwapRequestData, SignedSwapCommonData {}

export interface SignedSwapReleaseData extends SignedSwapCommonData {
  recipient: string,
  domainHash: string,
}

function checkCommonData(request: SignedSwapCommonData) {
  if (!request.chainId) {
    throw new Error('Missing chain id')
  } else if (!request.mesonAddress) {
    throw new Error('Missing meson contract address')
  } else if (!request.initiator) {
    throw new Error('Missing initiator')
  } else if (!request.signature) {
    throw new Error('Missing signature')
  }
}

export class SignedSwapRequest extends SwapRequest implements SignedSwapRequestData {
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

  constructor(signedReq: SignedSwapRequestData) {
    checkCommonData(signedReq)
    super(signedReq)
    this.swapId = signedReq.swapId
    this.chainId = signedReq.chainId
    this.mesonAddress = signedReq.mesonAddress
    this.initiator = signedReq.initiator
    this.signature = signedReq.signature
  }

  checkRequestSignature() {
    const signer = new SwapSigner(this.mesonAddress, Number(this.chainId))
    const recovered = signer.recoverFromRequestSignature(this)
    if (recovered !== this.initiator) {
      throw new Error('Invalid signature')
    }
  }
}

export class SignedSwapRelease implements SignedSwapReleaseData {
  readonly swapId: string
  readonly chainId: number
  readonly mesonAddress: string
  readonly initiator: BytesLike
  readonly signature: Signature

  readonly recipient: string;
  readonly domainHash: string;

  constructor(signedRelease: SignedSwapReleaseData) {
    checkCommonData(signedRelease)
    if (!signedRelease.recipient) {
      throw new Error('Missing recipient')
    } else if (!signedRelease.domainHash) {
      throw new Error('Missing meson domain hash')
    }
    this.swapId = signedRelease.swapId
    this.chainId = signedRelease.chainId
    this.mesonAddress = signedRelease.mesonAddress
    this.initiator = signedRelease.initiator
    this.signature = signedRelease.signature
    this.recipient = signedRelease.recipient
    this.domainHash = signedRelease.domainHash
  }

  checkReleaseSignature() {
    const signer = new SwapSigner(this.mesonAddress, Number(this.chainId))
    const recovered = signer.recoverFromReleaseSignature(this)
    if (recovered !== this.initiator) {
      throw new Error('Invalid signature')
    }
  }
}
