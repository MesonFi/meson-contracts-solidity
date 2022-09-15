import { recoverAddress } from '@ethersproject/transactions'

import type { Signature } from './SwapSigner'
import { Swap } from './Swap'
import { SwapSigner } from './SwapSigner'

export interface SignedSwapRequestData {
  testnet?: boolean,
  encoded: string,
  initiator: string,
  signature: Signature,
}

export interface SignedSwapReleaseData extends SignedSwapRequestData {
  recipient: string,
}

export class SignedSwapRequest implements SignedSwapRequestData {
  readonly testnet: boolean
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

    this.testnet = Boolean(data.testnet)
    this.swap = Swap.decode(data.encoded)

    this.encoded = data.encoded
    this.initiator = data.initiator.toLowerCase()
    this.signature = data.signature
  }

  getDigest () {
    return SwapSigner.hashRequest(this.encoded, this.testnet)
  }

  checkSignature () {
    const [r, s, v] = this.signature
    const recovered = recoverAddress(this.getDigest(), { r, s, v }).toLowerCase()
    if (recovered !== this.initiator) {
      throw new Error('Invalid signature')
    }
  }

  toObject (): SignedSwapRequestData {
    const data: SignedSwapRequestData = {
      encoded: this.encoded,
      initiator: this.initiator,
      signature: this.signature,
    }
    if (this.testnet) {
      data.testnet = true
    }
    return data
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
  
  getDigest () {
    return SwapSigner.hashRelease(this.encoded, this.recipient, this.testnet)
  }

  toObject (): SignedSwapReleaseData {
    return {
      ...super.toObject(),
      recipient: this.recipient,
    }
  }
}
