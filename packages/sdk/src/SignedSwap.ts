import type { Signature } from './SwapSigner'

import { recoverAddress } from '@ethersproject/transactions'

import { SwapRequest, SwapRequestData } from './SwapRequest'
import { SwapSigner } from './SwapSigner'

export interface SignedSwapRequestData extends SwapRequestData {
  swapId: string,
  initiator: string,
  chainId: number,
  mesonAddress: string,
  signature: Signature,
}

export interface SignedSwapReleaseData extends SignedSwapRequestData {
  recipient: string,
}

export class SignedSwapRequest extends SwapRequest implements SignedSwapRequestData {
  readonly swapId: string
  readonly domainHash: string
  readonly chainId: number
  readonly mesonAddress: string
  readonly initiator: string
  readonly signature: Signature
  readonly signer: SwapSigner

  static FromSerialized (json: string) {
    let parsed: SignedSwapRequestData
    try {
      parsed = JSON.parse(json)
    } catch {
      throw new Error('Invalid json string')
    }
    return new SignedSwapRequest(parsed)
  }

  constructor (data: SignedSwapRequestData) {
    super(data)

    if (!data.swapId) {
      throw new Error('Missing swapId')
    } else if (!data.chainId) {
      throw new Error('Missing chainId')
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
    this.domainHash = this.signer.getDomainHash()
    
    if (data.swapId !== this.signer.hashRequest(this.encode())) {
      throw new Error('Invalid swap id')
    }
  }

  get digest () { return this.swapId }

  checkSignature () {
    const [r, s, v] = this.signature
    const recovered = recoverAddress(this.digest, { r, s, v }).toLowerCase()
    if (recovered !== this.initiator) {
      throw new Error('Invalid signature')
    }
  }

  toObject (): SignedSwapRequestData {
    return {
      ...super.toObject(),
      swapId: this.swapId,
      initiator: this.initiator,
      chainId: this.chainId,
      mesonAddress: this.mesonAddress,
      signature: this.signature,
    }
  }
}

export class SignedSwapRelease extends SignedSwapRequest implements SignedSwapReleaseData {
  readonly recipient: string;

  constructor (data: SignedSwapReleaseData) {
    super(data)

    if (!data.recipient) {
      throw new Error('Missing recipient')
    }
    this.recipient = data.recipient
  }

  get digest () { return this.signer.hashRelease(this) }

  toObject (): SignedSwapReleaseData {
    return {
      ...super.toObject(),
      recipient: this.recipient,
    }
  }
}
