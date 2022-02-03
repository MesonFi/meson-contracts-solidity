import { recoverAddress } from '@ethersproject/transactions'

import type { Signature } from './SwapSigner'
import { Swap, SwapData } from './Swap'
import { SwapSigner } from './SwapSigner'

export interface SignedSwapRequestData extends SwapData {
  initiator: string,
  signature: Signature,
}

export interface SignedSwapReleaseData extends SignedSwapRequestData {
  recipient: string,
}

export class SignedSwapRequest extends Swap implements SignedSwapRequestData {
  readonly initiator: string
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

  constructor (data: SignedSwapRequestData) {
    super(data)

    if (data.encoded !== this.encoded) {
      throw new Error('Invalid encoded value')
    } else if (!data.initiator) {
      throw new Error('Missing initiator')
    } else if (!data.signature) {
      throw new Error('Missing signature')
    }

    this.initiator = data.initiator.toLowerCase()
    this.signature = data.signature
  }

  get digest () { return SwapSigner.hashRequest(this.encoded) }

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
      initiator: this.initiator,
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

  get digest () { return SwapSigner.hashRelease(this.encoded, this.recipient) }

  toObject (): SignedSwapReleaseData {
    return {
      ...super.toObject(),
      recipient: this.recipient,
    }
  }
}
