import { recoverAddress } from '@ethersproject/transactions'

import type { Signature } from './SwapSigner'
import { Swap } from './Swap'
import { SwapSigner } from './SwapSigner'

export interface SignedSwapRequestData {
  encoded: string,
  initiator: string,
  signature: Signature,
}

export interface SignedSwapReleaseData extends SignedSwapRequestData {
  recipient: string,
}

export class SignedSwapRequest implements SignedSwapRequestData {
  readonly swap: Swap
  readonly encoded: string
  readonly initiator: string
  readonly signature: Signature

  constructor (data: SignedSwapRequestData) {
    if (!data.encoded) {
      throw new Error('Missing encoded')
    } else if (!data.initiator) {
      throw new Error('Missing initiator')
    } else if (!data.signature) {
      throw new Error('Missing signature')
    }

    this.swap = Swap.decode(data.encoded)

    this.encoded = data.encoded
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
      encoded: this.encoded,
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
