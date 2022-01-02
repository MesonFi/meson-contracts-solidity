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

  constructor (req: SignedSwapRequestData) {
    if (!req.chainId) {
      throw new Error('Missing chain id')
    } else if (!req.mesonAddress) {
      throw new Error('Missing meson contract address')
    } else if (!req.initiator) {
      throw new Error('Missing initiator')
    } else if (!req.signature) {
      throw new Error('Missing signature')
    }

    const signer = new SwapSigner(req.mesonAddress, Number(req.chainId))
    const recovered = signer.recoverFromRequestSignature(req.encoded, req.signature)
    if (recovered !== req.initiator) {
      throw new Error('Invalid signature')
    }

    super(req)

    if (this.encode() !== req.encoded) {
      throw new Error('Encoded value mismatch')
    }

    this.signer = signer
    this.chainId = req.chainId
    this.mesonAddress = req.mesonAddress
    this.initiator = req.initiator
    this.signature = req.signature
  }

  checkReleaseSignature (signature: [string, string, number]) {
    const recovered = this.signer.recoverFromReleaseSignature(this.swapId, signature)
    if (recovered !== this.initiator) {
      throw new Error('Invalid signature')
    }
  }
}
