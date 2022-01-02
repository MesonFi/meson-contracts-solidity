import { _TypedDataEncoder } from '@ethersproject/hash'
import { BytesLike } from '@ethersproject/bytes'

import { SwapSigner } from './SwapSigner'
import { SwapRequest, SwapRequestData } from './SwapRequest'

export interface SignedSwapRequestData extends SwapRequestData {
  encoded: BytesLike,
  initiator: BytesLike,
  chainId: number,
  mesonAddress: string,
  signature: [string, string, number],
}

export class SignedSwapRequest extends SwapRequest {
  readonly signer: SwapSigner
  readonly chainId: number
  readonly mesonAddress: string
  readonly initiator: BytesLike
  readonly signature: [string, string, number]

  constructor (serialized: string) {
    let parsed: SignedSwapRequestData
    try {
      parsed = JSON.parse(serialized)
    } catch {
      throw new Error('Invalid json string')
    }

    if (!parsed.chainId) {
      throw new Error('Missing chain id')
    } else if (!parsed.mesonAddress) {
      throw new Error('Missing meson contract address')
    } else if (!parsed.initiator) {
      throw new Error('Missing initiator')
    } else if (!parsed.signature) {
      throw new Error('Missing signature')
    }

    const signer = new SwapSigner(parsed.mesonAddress, Number(parsed.chainId))
    const recovered = signer.recoverFromRequestSignature(parsed.encoded, parsed.signature)
    if (recovered !== parsed.initiator) {
      throw new Error('Invalid signature')
    }

    super(parsed)

    if (this.encode() !== parsed.encoded) {
      throw new Error('Encoded value mismatch')
    }

    this.signer = signer
    this.chainId = parsed.chainId
    this.mesonAddress = parsed.mesonAddress
    this.initiator = parsed.initiator
    this.signature = parsed.signature
  }

  checkReleaseSignature (signature: [string, string, number]) {
    const recovered = this.signer.recoverFromReleaseSignature(this.swapId, signature)
    if (recovered !== this.initiator) {
      throw new Error('Invalid signature')
    }
  }
}
