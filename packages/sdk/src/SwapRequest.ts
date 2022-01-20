import type { BytesLike } from '@ethersproject/bytes'
import { _TypedDataEncoder } from '@ethersproject/hash'

export const SWAP_REQUEST_TYPE = {
  SwapRequest: [
    { name: 'inToken', type: 'bytes' },
    { name: 'amount', type: 'uint128' },
    { name: 'fee', type: 'uint48' },
    { name: 'expireTs', type: 'uint48' },
    { name: 'outChain', type: 'bytes4' },
    { name: 'outToken', type: 'bytes' },
  ]
}

export const SWAP_RELEASE_TYPE = {
  SwapRelease: [
    { name: 'swapId', type: 'bytes32' },
    { name: 'recipient', type: 'bytes' },
  ]
}

export interface SwapRequestData {
  inChain: BytesLike,
  inToken: BytesLike,
  amount: string,
  fee: string,
  expireTs: number,
  outChain: BytesLike,
  outToken: BytesLike,
}

export class SwapRequest implements SwapRequestData {
  readonly inChain: BytesLike
  readonly inToken: BytesLike
  readonly amount: string
  readonly fee: string
  readonly expireTs: number
  readonly outChain: BytesLike
  readonly outToken: BytesLike

  private _encoded: BytesLike = ''

  constructor(req: SwapRequestData) {
    if (!req.expireTs) {
      throw new Error('Missing expireTs')
    } else if (!req.inChain) {
      throw new Error('Missing inChain')
    } else if (!req.inToken) {
      throw new Error('Missing inToken')
    } else if (!req.amount) {
      throw new Error('Missing amount')
    } else if (!req.outChain) {
      throw new Error('Missing outChain')
    } else if (!req.outToken) {
      throw new Error('Missing outToken')
    }

    this.inChain = req.inChain
    this.inToken = req.inToken
    this.amount = req.amount
    this.fee = req.fee
    this.expireTs = req.expireTs
    this.outChain = req.outChain
    this.outToken = req.outToken
  }

  encode(): BytesLike {
    if (!this._encoded) {
      this._encoded = _TypedDataEncoder.from(SWAP_REQUEST_TYPE).encode(this)
    }
    return this._encoded
  }

  toObject(): SwapRequestData {
    return {
      inChain: this.inChain,
      inToken: this.inToken,
      amount: this.amount,
      fee: this.fee,
      expireTs: this.expireTs,
      outChain: this.outChain,
      outToken: this.outToken,
    }
  }

  serialize(): string {
    return JSON.stringify(this.toObject())
  }
}
