import { pack } from '@ethersproject/solidity'
import { _TypedDataEncoder } from '@ethersproject/hash'

const swapStruct = [
  { name: 'amount', type: 'uint128' },
  { name: 'fee', type: 'uint40' },
  { name: 'expireTs', type: 'uint40' },
  { name: 'outChain', type: 'bytes2' },
  { name: 'outToken', type: 'uint8' },
  { name: 'inChain', type: 'bytes2' },
  { name: 'inToken', type: 'uint8' },
]
export interface SwapRequestData {
  encoded?: string,
  amount: string,
  fee: string,
  expireTs: number,
  inChain: string,
  inToken: number,
  outChain: string,
  outToken: number,
}

export class SwapRequest implements SwapRequestData {
  readonly amount: string
  readonly fee: string
  readonly expireTs: number
  readonly inChain: string
  readonly inToken: number
  readonly outChain: string
  readonly outToken: number

  private _encoded: string = ''

  constructor(data: SwapRequestData) {
    if (!data.amount) {
      throw new Error('Missing amount')
    } else if (!data.fee) {
      throw new Error('Missing fee')
    } else if (!data.expireTs) {
      throw new Error('Missing expireTs')
    } else if (!data.inChain) {
      throw new Error('Missing inChain')
    } else if (typeof data.inToken !== 'number') {
      throw new Error('Invalid inToken')
    } else if (!data.outChain) {
      throw new Error('Missing outChain')
    } else if (typeof data.outToken !== 'number') {
      throw new Error('Invalid outToken')
    }

    this.amount = data.amount
    this.fee = data.fee
    this.expireTs = data.expireTs
    this.inChain = data.inChain
    this.inToken = data.inToken
    this.outChain = data.outChain
    this.outToken = data.outToken
  }

  get encoded(): string {
    if (!this._encoded) {
      const types = swapStruct.map(i => i.type)
      const values = swapStruct.map(i => (this as any)[i.name])
      this._encoded = pack(types, values)
    }
    return this._encoded
  }

  toObject(): SwapRequestData {
    return {
      encoded: this.encoded,
      amount: this.amount,
      fee: this.fee,
      expireTs: this.expireTs,
      inChain: this.inChain,
      inToken: this.inToken,
      outChain: this.outChain,
      outToken: this.outToken,
    }
  }

  serialize(): string {
    return JSON.stringify(this.toObject())
  }
}
