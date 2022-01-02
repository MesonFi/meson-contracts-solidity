import { _TypedDataEncoder } from '@ethersproject/hash'
import { BytesLike } from '@ethersproject/bytes'

import { SwapRequest, SwapRequestData } from './SwapRequest'

export interface SignedSwapRequestData extends SwapRequestData {
  encoded: BytesLike,
  initiator: BytesLike,
  chainId: number,
  mesonAddress: string,
  signature: [string, string, number],
}

export class SignedSwapRequest extends SwapRequest {
  readonly chainId: number
  readonly mesonAddress: string
  readonly initiator: BytesLike
  readonly signature: [string, string, number]

  constructor (req: SignedSwapRequestData) {
    super(req)
    this.chainId = req.chainId
    this.mesonAddress = req.mesonAddress
    this.initiator = req.initiator
    this.signature = req.signature
  }
}
