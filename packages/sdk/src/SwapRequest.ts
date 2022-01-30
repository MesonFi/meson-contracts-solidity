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
  inChain: string,
  inToken: string,
  amount: string,
  fee: string,
  expireTs: number,
  outChain: string,
  outToken: string,
}

export class SwapRequest implements SwapRequestData {
  readonly inChain: string
  readonly inToken: string
  readonly amount: string
  readonly fee: string
  readonly expireTs: number
  readonly outChain: string
  readonly outToken: string

  private _encoded: string = ''

  constructor(data: SwapRequestData) {
    if (!data.expireTs) {
      throw new Error('Missing expireTs')
    } else if (!data.inChain) {
      throw new Error('Missing inChain')
    } else if (!data.inToken) {
      throw new Error('Missing inToken')
    } else if (!data.amount) {
      throw new Error('Missing amount')
    } else if (!data.fee) {
      throw new Error('Missing fee')
    } else if (!data.outChain) {
      throw new Error('Missing outChain')
    } else if (!data.outToken) {
      throw new Error('Missing outToken')
    }

    this.inChain = data.inChain
    this.inToken = data.inToken
    this.amount = data.amount
    this.fee = data.fee
    this.expireTs = data.expireTs
    this.outChain = data.outChain
    this.outToken = data.outToken
  }

  encode(): string {
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
