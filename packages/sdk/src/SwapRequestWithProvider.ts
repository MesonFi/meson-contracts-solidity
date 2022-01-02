import { _TypedDataEncoder } from '@ethersproject/hash'
import { keccak256 } from '@ethersproject/keccak256'
import { recoverAddress } from '@ethersproject/transactions'
import { hexConcat, BytesLike } from '@ethersproject/bytes'

import { MesonClient } from './MesonClient'
import { SwapRequest, SwapRequestData } from './SwapRequest'

interface SignedSwapRequestData extends SwapRequestData {
  encoded: BytesLike,
  initiator: BytesLike,
  signatures: [BytesLike, BytesLike, number],
}

export class SwapRequestWithProvider extends SwapRequest {
  readonly mesonClient: MesonClient
  readonly initiator: BytesLike
  readonly signatures: [BytesLike, BytesLike, number]
  
  constructor (
    req: SignedSwapRequestData,
    mesonClient: MesonClient
  ) {
    super(req)
    this.initiator = req.initiator
    this.signatures = req.signatures
    this.mesonClient = mesonClient
  }

  static FromSerialized (serialized: string, mesonClient: MesonClient) {
    let parsed: SignedSwapRequestData
    try {
      parsed = JSON.parse(serialized)
    } catch {
      throw new Error('Invalid json string')
    }
    if (!parsed.signatures) {
      throw new Error('Missing signature')
    }

    const digest = keccak256(hexConcat([
      '0x1901',
      _TypedDataEncoder.hashDomain(mesonClient.eip712Domain),
      keccak256(parsed.encoded)
    ]))
    const recovered = recoverAddress(digest, {
      r: parsed.signatures[0] as string,
      s: parsed.signatures[1] as string,
      v: parsed.signatures[2],
    }).toLowerCase()
    if (recovered !== parsed.initiator) {
      throw new Error('Invalid signature')
    }
    
    const swap = new SwapRequestWithProvider(parsed, mesonClient)
    if (swap.encode() !== parsed.encoded) {
      throw new Error('Encoded value mismatch')
    }
    return swap
  }

  async post () {
    return this.mesonClient.mesonInstance.postSwap(
      this.encode(),
      this.inToken,
      this.initiator,
      ...this.signatures
    )
  }

  async execute (releaseSignatures: [BytesLike, BytesLike, number]) {
    return this.mesonClient.mesonInstance.executeSwap(this.id(), ...releaseSignatures)
  }
}