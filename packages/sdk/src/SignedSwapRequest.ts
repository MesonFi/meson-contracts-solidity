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

  static FromSerialized (json: string) {
    let parsed: SignedSwapRequestData
    try {
      parsed = JSON.parse(json)
    } catch {
      throw new Error('Invalid json string')
    }
    return new SignedSwapRequest(parsed)
  }

  constructor (signedSwap: SignedSwapRequestData) {
    if (!signedSwap.chainId) {
      throw new Error('Missing chain id')
    } else if (!signedSwap.mesonAddress) {
      throw new Error('Missing meson contract address')
    } else if (!signedSwap.initiator) {
      throw new Error('Missing initiator')
    } else if (!signedSwap.signature) {
      throw new Error('Missing signature')
    }

    const signer = new SwapSigner(signedSwap.mesonAddress, Number(signedSwap.chainId))
    const recovered = signer.recoverFromRequestSignature(signedSwap.encoded, signedSwap.signature)
    if (recovered !== signedSwap.initiator) {
      throw new Error('Invalid signature')
    }

    super(signedSwap)

    if (this.encode() !== signedSwap.encoded) {
      throw new Error('Encoded value mismatch')
    }

    this.signer = signer
    this.chainId = signedSwap.chainId
    this.mesonAddress = signedSwap.mesonAddress
    this.initiator = signedSwap.initiator
    this.signature = signedSwap.signature
  }

  checkReleaseSignature (signature: [string, string, number]) {
    const recovered = this.signer.recoverFromReleaseSignature(this.swapId, signature)
    if (recovered !== this.initiator) {
      throw new Error('Invalid signature')
    }
  }
}
