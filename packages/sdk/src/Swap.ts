import { pack } from '@ethersproject/solidity'
import { hexZeroPad } from '@ethersproject/bytes'
import { BigNumber } from '@ethersproject/bignumber'

const swapStruct = [
  { name: 'amount', type: 'uint48' },
  { name: 'salt', type: 'uint80' },
  { name: 'fee', type: 'uint40' },
  { name: 'expireTs', type: 'uint40' },
  { name: 'outChain', type: 'bytes2' },
  { name: 'outToken', type: 'uint8' },
  { name: 'inChain', type: 'bytes2' },
  { name: 'inToken', type: 'uint8' },
]

export interface SwapData {
  encoded?: string,
  amount: number,
  salt?: string,
  fee: string,
  expireTs: number,
  inChain: string,
  inToken: number,
  outChain: string,
  outToken: number,
}

export class Swap implements SwapData {
  readonly amount: number
  readonly salt: string
  readonly fee: string
  readonly expireTs: number
  readonly inChain: string
  readonly inToken: number
  readonly outChain: string
  readonly outToken: number

  private _encoded: string = ''

  static decode (encoded: string | BigNumber): Swap {
    if (typeof encoded !== 'string') {
      encoded = hexZeroPad(encoded.toHexString(), 32)
    }
    if (!encoded.startsWith('0x') || encoded.length !== 66) {
      throw new Error('encoded swap should be a hex string of length 66')
    }
    const amount = parseInt(`0x${encoded.substring(2, 14)}`, 16)
    const salt = BigNumber.from(`0x${encoded.substring(14, 34)}`).toString()
    const fee = BigNumber.from(`0x${encoded.substring(34, 44)}`).toString()
    const expireTs = parseInt(`0x${encoded.substring(44, 54)}`, 16)
    const outChain = `0x${encoded.substring(54, 58)}`
    const outToken = parseInt(`0x${encoded.substring(58, 60)}`, 16)
    const inChain = `0x${encoded.substring(60, 64)}`
    const inToken = parseInt(`0x${encoded.substring(64, 66)}`, 16)

    return new Swap({ amount, salt, fee, expireTs, inChain, inToken, outChain, outToken })
  }

  constructor(data: SwapData) {
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
    this.salt = data.salt || Math.floor(Math.random() * 4294967296).toString()
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

  toObject(): SwapData {
    return {
      encoded: this.encoded,
      amount: this.amount,
      salt: this.salt,
      fee: this.fee,
      expireTs: this.expireTs,
      inChain: this.inChain,
      inToken: this.inToken,
      outChain: this.outChain,
      outToken: this.outToken,
    }
  }
}
