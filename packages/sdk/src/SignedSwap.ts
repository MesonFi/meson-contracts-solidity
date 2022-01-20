import type { BytesLike } from '@ethersproject/bytes'
import type { Signature } from './SwapSigner'

import { recoverAddress } from '@ethersproject/transactions'

import { SwapRequest, SwapRequestData } from './SwapRequest'
import { SwapSigner } from './SwapSigner'

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

class SignedSwapCommon implements SignedSwapCommonData {
  readonly swapId: string
  readonly chainId: number
  readonly mesonAddress: string
  readonly initiator: BytesLike
  readonly signature: Signature
  readonly signer: SwapSigner

  constructor(data: SignedSwapCommonData) {
    if (!data.chainId) {
      throw new Error('Missing chain id')
    } else if (!data.mesonAddress) {
      throw new Error('Missing meson contract address')
    } else if (!data.initiator) {
      throw new Error('Missing initiator')
    } else if (!data.signature) {
      throw new Error('Missing signature')
    }
    this.swapId = data.swapId
    this.chainId = data.chainId
    this.mesonAddress = data.mesonAddress
    this.initiator = data.initiator
    this.signature = data.signature
    this.signer = new SwapSigner(this.mesonAddress, Number(this.chainId))
  }
}

export class SignedSwapRequest extends SignedSwapCommon {
  readonly req: SwapRequest

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
    super(signedReq)
    this.req = new SwapRequest(signedReq)

    if (signedReq.swapId !== this.signer.getSwapId(signedReq)) {
      throw new Error('Invalid swap id')
    }

    this._checkRequestSignature()
  }

  encode () { return this.req.encode() }
  get expireTs () { return this.req.expireTs }
  get inChain () { return this.req.inChain }
  get inToken () { return this.req.inToken }
  get amount () { return this.req.amount }
  get outChain () { return this.req.outChain }
  get outToken () { return this.req.outToken }

  _checkRequestSignature() {
    const [r, s, v] = this.signature
    const recovered = recoverAddress(this.swapId, { r, s, v }).toLowerCase()
    if (recovered !== this.initiator) {
      throw new Error('Invalid signature')
    }
  }
}

export class SignedSwapRelease extends SignedSwapCommon implements SignedSwapReleaseData {
  readonly recipient: string;
  readonly domainHash: string;

  constructor(signedRelease: SignedSwapReleaseData) {
    super(signedRelease)
    if (!signedRelease.recipient) {
      throw new Error('Missing recipient')
    } else if (!signedRelease.domainHash) {
      throw new Error('Missing meson domain hash')
    }
    this.recipient = signedRelease.recipient
    this.domainHash = signedRelease.domainHash

    this._checkReleaseSignature()
  }

  _checkReleaseSignature() {
    const digest = this.signer.hashRelease(this)
    const [r, s, v] = this.signature
    const recovered = recoverAddress(digest, { r, s, v }).toLowerCase()
    if (recovered !== this.initiator) {
      throw new Error('Invalid signature')
    }
  }
}
