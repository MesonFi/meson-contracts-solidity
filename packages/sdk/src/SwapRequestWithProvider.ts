import { Contract, Wallet, BytesLike } from 'ethers'

import { SwapRequest, SwapRequestData } from './SwapRequest'

export class SwapRequestWithProvider extends SwapRequest {
  readonly mesonInstance: Contract
  readonly signatures: [BytesLike, BytesLike, number]
  
  constructor (
    req: SwapRequestData,
    signatures: [BytesLike, BytesLike, number],
    mesonInstance: Contract
  ) {
    super(req)
    this.signatures = signatures
    this.mesonInstance = mesonInstance
  }

  static FromSerialized (serialized: string, mesonInstance: Contract) {
    let parsed
    try {
      parsed = JSON.parse(serialized)
    } catch {
      throw new Error('Invalid json string')
    }
    if (!parsed.signatures) {
      throw new Error('Missing signatures')
    }
    const swap = new SwapRequestWithProvider(parsed, parsed.signatures, mesonInstance)
    if (swap.encode() !== parsed.encoded) {
      throw new Error('Encoded value mismatch')
    }
    return swap
  }

  async post (initiatorAddress: BytesLike) {
    // TODO check signatures
    return this.mesonInstance.postSwap(
      this.encode(),
      this.inToken,
      initiatorAddress,
      ...this.signatures
    )
  }

  async execute (releaseSignatures: [BytesLike, BytesLike, number]) {
    return this.mesonInstance.executeSwap(this.id(), ...releaseSignatures)
  }
}