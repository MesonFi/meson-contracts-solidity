import { pack } from '@ethersproject/solidity'
import { hexlify, hexZeroPad, isHexString } from '@ethersproject/bytes'
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { randomBytes } from '@ethersproject/random'

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
  amount: BigNumberish,
  salt?: string,
  fee: BigNumberish,
  expireTs: number,
  inChain: string,
  inToken: number,
  outChain: string,
  outToken: number,
}

export class Swap implements SwapData {
  readonly amount: BigNumber
  readonly salt: string
  readonly fee: BigNumber
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
    const amount = BigNumber.from(`0x${encoded.substring(2, 14)}`)
    const salt = `0x${encoded.substring(14, 34)}`
    const fee = BigNumber.from(`0x${encoded.substring(34, 44)}`)
    const expireTs = parseInt(`0x${encoded.substring(44, 54)}`, 16)
    const outChain = `0x${encoded.substring(54, 58)}`
    const outToken = parseInt(`0x${encoded.substring(58, 60)}`, 16)
    const inChain = `0x${encoded.substring(60, 64)}`
    const inToken = parseInt(`0x${encoded.substring(64, 66)}`, 16)

    return new Swap({ amount, salt, fee, expireTs, inChain, inToken, outChain, outToken })
  }

  constructor(data: SwapData) {
    try {
      this.amount = BigNumber.from(data.amount)
    } catch {
      throw new Error('Invalid amount')
    }
    try {
      this.fee = BigNumber.from(data.fee || 0)
    } catch {
      throw new Error('Invalid fee')
    }

    if (this.amount.lte(0)) {
      throw new Error('Amount must be positive')
    } else if (this.fee.lt(0)) {
      throw new Error('Fee must be non-negative')
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

    this.salt = this._makeFullSalt(data.salt)
    this.expireTs = data.expireTs
    this.inChain = data.inChain
    this.inToken = data.inToken
    this.outChain = data.outChain
    this.outToken = data.outToken
  }

  private _makeFullSalt(salt?: string): string {
    if (salt) {
      if (!isHexString(salt) || salt.length > 22) {
        throw new Error('The given salt is invalid')
      }
      return `${salt}${this._randomHex(22 - salt.length)}`
    }

    return `0x0000${this._randomHex(16)}`
  }

  private _randomHex(strLength: number) {
    if (strLength === 0) {
      return ''
    }
    const randomLength = Math.min((strLength / 2), 4)
    return hexZeroPad(randomBytes(randomLength), strLength / 2).replace('0x', '')
  }

  get encoded(): string {
    if (!this._encoded) {
      const types = swapStruct.map(i => i.type)
      const values = swapStruct.map(i => (this as any)[i.name])
      this._encoded = pack(types, values)
    }
    return this._encoded
  }

  get deprecatedEncoding() : boolean {
    return this.salt.startsWith('0x00') || this.salt.startsWith('0xff')
  }

  get willWaiveFee(): boolean {
    return (parseInt(this.salt[2], 16) % 8) >= 4
  }

  get serviceFee(): BigNumber {
    if (this.deprecatedEncoding) {
      return BigNumber.from(0)
    }
    return this.willWaiveFee ? BigNumber.from(0) : this.amount.div(1000)
  }

  get platformFee(): BigNumber {
    // deprecated
    return this.serviceFee
  }

  get totalFee(): BigNumber {
    return this.serviceFee.add(this.fee)
  }

  toObject(): SwapData {
    return {
      encoded: this.encoded,
      amount: this.amount.toNumber(),
      salt: this.salt,
      fee: this.fee.toNumber(),
      expireTs: this.expireTs,
      inChain: this.inChain,
      inToken: this.inToken,
      outChain: this.outChain,
      outToken: this.outToken,
    }
  }
}
