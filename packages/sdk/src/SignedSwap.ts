import type { Signature } from './SwapSigner'

import { recoverAddress } from '@ethersproject/transactions'
import { hashMessage } from "@ethersproject/hash";
import { arrayify } from '@ethersproject/bytes'

import { SwapRequest, SwapRequestData } from './SwapRequest'
import { SwapSigner } from './SwapSigner'

export interface SignedSwapRequestData extends SwapRequestData {
  initiator: string,
  chainId: number,
  mesonAddress: string,
  signature: Signature,
}

export interface SignedSwapReleaseData extends SignedSwapRequestData {
  recipient: string,
}

export class SignedSwapRequest extends SwapRequest implements SignedSwapRequestData {
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

    if (data.encoded !== this.encoded) {
      throw new Error('Invalid encoded value')
    } else if (!data.chainId) {
      throw new Error('Missing chainId')
    } else if (!data.mesonAddress) {
      throw new Error('Missing meson contract address')
    } else if (!data.initiator) {
      throw new Error('Missing initiator')
    } else if (!data.signature) {
      throw new Error('Missing signature')
    }
    this.chainId = data.chainId
    this.mesonAddress = data.mesonAddress
    this.initiator = data.initiator
    this.signature = data.signature

    this.signer = new SwapSigner(this.mesonAddress, Number(this.chainId))
  }

  get digest () {
    return hashMessage(arrayify(this.encoded))
  }

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
      chainId: this.chainId,
      mesonAddress: this.mesonAddress,
      initiator: this.initiator,
      signature: this.signature,
    }
  }
}

export class SignedSwapRelease extends SignedSwapRequest implements SignedSwapReleaseData {
  readonly recipient: string;
  readonly domainHash: string

  constructor (data: SignedSwapReleaseData) {
    super(data)

    if (!data.recipient) {
      throw new Error('Missing recipient')
    }
    this.recipient = data.recipient
    this.domainHash = this.signer.getDomainHash()
  }

  get digest () { return this.signer.hashRelease(this) }

  toObject (): SignedSwapReleaseData {
    return {
      ...super.toObject(),
      recipient: this.recipient,
    }
  }
}
