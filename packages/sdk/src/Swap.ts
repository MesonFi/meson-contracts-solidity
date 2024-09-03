import { BigNumber, BigNumberish, utils } from 'ethers'

const MESON_PROTOCOL_VERSION = 1

const swapStruct = [
  { name: 'version', type: 'uint8' },
  { name: 'amount', type: 'uint40' },
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
  version?: number,
  amount: BigNumberish,
  salt?: string,
  saltHeader?: string,
  saltData?: string,
  amountForCoreToken?: BigNumberish,
  coreTokenPrice?: number,
  poolIndexToShare?: number,
  amountToShare?: BigNumberish,
  fee: BigNumberish,
  expireTs: number,
  inChain: string,
  inToken: number,
  outChain: string,
  outToken: number,
}

export class Swap implements SwapData {
  readonly version: number
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
      encoded = utils.hexZeroPad(encoded.toHexString(), 32)
    }
    if (!encoded.startsWith('0x') || encoded.length !== 66) {
      throw new Error('encoded swap should be a hex string of length 66')
    }
    const version = parseInt(`0x${encoded.substring(2, 4)}`, 16)
    const amount = BigNumber.from(`0x${encoded.substring(4, 14)}`)
    const saltHeader = `0x${encoded.substring(14, 18)}`
    const saltData = `0x${encoded.substring(18, 34)}`
    const fee = BigNumber.from(`0x${encoded.substring(34, 44)}`)
    const expireTs = parseInt(`0x${encoded.substring(44, 54)}`, 16)
    const outChain = `0x${encoded.substring(54, 58)}`
    const outToken = parseInt(`0x${encoded.substring(58, 60)}`, 16)
    const inChain = `0x${encoded.substring(60, 64)}`
    const inToken = parseInt(`0x${encoded.substring(64, 66)}`, 16)

    return new Swap({ version, amount, saltHeader, saltData, fee, expireTs, inChain, inToken, outChain, outToken })
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

    this.version = typeof data.version === 'number' ? data.version : MESON_PROTOCOL_VERSION
    this.expireTs = data.expireTs
    this.inChain = data.inChain
    this.inToken = data.inToken
    this.outChain = data.outChain
    this.outToken = data.outToken
    this.salt = data.saltHeader || '0x0000'
    this.salt = this._makeFullSalt(data)
  }

  private _makeFullSalt(data: SwapData): string {
    const {
      salt,
      saltHeader,
      saltData = '0x',
      coreTokenPrice,
      poolIndexToShare,
      amountToShare,
    } = data
    if (salt) {
      if (!utils.isHexString(salt) || salt.length > 22) {
        throw new Error('The given salt is invalid')
      }
      return `${salt}${this._randomHex(22 - salt.length)}`
    }
    if (saltHeader) {
      if (saltData !== '0x') {
        return `${saltHeader}${saltData.substring(2)}${this._randomHex(18 - saltData.length)}`
      }
      if (this.swapForCoreToken) {
        if (this._newFormat) {
          const saltData1 = this._compressFixedPrecision((coreTokenPrice || 0) * 1e4)
          if (saltData1.length > 4) {
            throw new Error('Invalid coreTokenPrice; overflow')
          }
          const saltData2 = data.amountForCoreToken === 'all'
            ? 'ffff'
            : this._compressFixedPrecision(BigNumber.from(data.amountForCoreToken || 0).div(1e3))
          if (saltData2.length > 4) {
            throw new Error('Invalid amountForCoreToken; overflow')
          }
          return `${saltHeader}${saltData1}${saltData2}${this._randomHex(8)}`
        } else {
          const len = this._splitPos - 6
          const saltData1 = BigNumber.from((coreTokenPrice || 0) * this._pFactor)
            .toHexString().substring(2).replace(/^0/, '').padStart(len, '0')
          if (saltData1.length > len) {
            throw new Error('Invalid coreTokenPrice; overflow')
          }
          const saltData2 = BigNumber.from(data.amountForCoreToken || 0).div(1e5)
            .toHexString().substring(2).replace(/^0/, '').padStart(8 - len, '0')
          if (saltData2.length > (8 - len)) {
            throw new Error('Invalid amountForCoreToken; overflow')
          }
          return `${saltHeader}${saltData1}${saltData2}${this._randomHex(8)}`
        }
      } else if (this.shareWithPartner) {
        if (!Number.isInteger(poolIndexToShare) || poolIndexToShare < 65536 || poolIndexToShare > 65536 * 2 - 1) {
          throw new Error('Invalid poolIndexToShare')
        }
        const saltData1 = (poolIndexToShare - 65536).toString(16).padStart(4, '0')
        const saltData2 = this._compressFixedPrecision(amountToShare)
        if (saltData2.length > 4) {
          throw new Error('Invalid amountToShare; overflow')
        }
        return `${saltHeader}${saltData1}${saltData2}${this._randomHex(8)}`
      }
      return `${saltHeader}${this._randomHex(16)}`
    }
    return `0x0000${this._randomHex(16)}`
  }

  private _randomHex(strLength: number) {
    if (strLength === 0) {
      return ''
    }
    const randomLength = Math.min((strLength / 2), 4)
    return utils.hexZeroPad(utils.randomBytes(randomLength), strLength / 2).replace('0x', '')
  }

  get encoded(): string {
    if (!this._encoded) {
      const types = swapStruct.map(i => i.type)
      const values = swapStruct.map(i => (this as any)[i.name])
      this._encoded = utils.solidityPack(types, values)
    }
    return this._encoded
  }

  get deprecatedEncoding(): boolean {
    return this.version < MESON_PROTOCOL_VERSION
  }

  _isUCT(forOutToken: boolean = false): boolean {
    if (forOutToken) {
      return this.expireTs < 1691700000 && this.outToken === 255
    } else {
      return this.expireTs < 1691700000 && this.inToken === 255
    }
  }

  v(forOutToken: boolean = false): string {
    if (this.version === 0) {
      return 'v0'
    } else if (this._isUCT(forOutToken)) {
      return 'v1_uct'
    } else {
      return `v${this.version}`
    }
  }

  get willTransferToContract(): boolean {
    return (parseInt(this.salt[2], 16) & 8) === 0
  }

  get willWaiveFee(): boolean {
    return (parseInt(this.salt[2], 16) & 4) === 4
  }

  get serviceFee(): BigNumber {
    if (this.deprecatedEncoding || this.willWaiveFee) {
      return BigNumber.from(0)
    }
    const minFee = BigNumber.from(Swap.minServiceFee(this.inToken))
    const fee = this.amount.div(2000)
    return fee.gt(minFee) ? fee : minFee
  }

  static minServiceFee(tokenIndex: number): number {
    if (tokenIndex >= 252) {
      return 500 // 0.0005 ETH
    } else if (tokenIndex >= 244) {
      return 5000 // 0.005 BNB or SOL
    } else if (tokenIndex >= 240) {
      return 50 // 0.00005 BTC
    } else if (tokenIndex >= 236) {
      return 500_000 // 0.5 MATIC
    }
    return 500_000 // $0.5
  }

  get totalFee(): BigNumber {
    return this.serviceFee.add(this.fee)
  }

  get receive(): BigNumber {
    return this.amount.sub(this.totalFee).sub(this.amountForCoreToken).sub(this.amountToShare)
  }

  get swapForCoreToken(): boolean {
    return !this.willTransferToContract && ((parseInt(this.salt[3], 16) & 4) === 4)
  }

  get _newFormat(): boolean {
    return (parseInt(this.salt[4], 16) & 1) === 1 && this.expireTs > new Date('2024-03-01').valueOf() / 1000
  }

  get _splitPos() : number {
    if (this._newFormat) {
      return 10
    }
    return ['0x6868', '0x03ea'].includes(this.outChain) ? 10 : 11 // adhoc, merlin & b2
  }

  get amountForCoreToken(): BigNumber {
    if (!this.swapForCoreToken) {
      return BigNumber.from(0)
    } else if (this._newFormat) {
      const d = '0x' + this.salt.slice(10, 14)
      if (d === '0xffff') {
        return this.amount.sub(this.totalFee)
      }
      return BigNumber.from(this._decompressFixedPrecision(d)).mul(1e3)
    }
    return BigNumber.from(parseInt(this.salt.slice(this._splitPos, 14), 16)).mul(1e5)
  }

  get coreTokenPrice(): number {
    if (!this.swapForCoreToken) {
      return
    } else if (this._newFormat) {
      return Number(this._decompressFixedPrecision('0x' + this.salt.slice(6, 10))) / 1e4
    }
    return parseInt(this.salt.slice(6, this._splitPos), 16) / this._pFactor
  }

  get coreTokenAmount(): BigNumber {
    if (this.amountForCoreToken.eq(0)) {
      return BigNumber.from(0)
    } else if (this._newFormat) {
      return this.amountForCoreToken.mul(1e4).div(this.coreTokenPrice * 1e4)
    }
    return this.amountForCoreToken.mul(this._pFactor).div(this.coreTokenPrice * this._pFactor)
  }

  get _pFactor() : number {
    if (this.outChain === '0x56ce') {
      return 1000
    } else if (['0x6868', '0x03ea'].includes(this.outChain)) { // adhoc, merlin & b2
      return 1
    } else {
      return 10
    }
  }

  get shareWithPartner(): boolean {
    return !this.willTransferToContract && ((parseInt(this.salt[3], 16) & 6) === 2)
  }

  get poolIndexToShare(): number {
    return this.shareWithPartner ? (parseInt(this.salt.slice(6, 10), 16) + 65536) : 0
  }

  get amountToShare(): BigNumber {
    if (!this.poolIndexToShare) {
      return BigNumber.from(0)
    }
    return BigNumber.from(this._decompressFixedPrecision('0x' + this.salt.slice(10, 14)))
  }

  _compressFixedPrecision(value: BigNumberish, precision = 3): string {
    const mod = 9n * 10n ** BigInt(precision)
    const d = BigNumber.from(value).toBigInt()
    const pow = Math.ceil(Math.log10(Number(d)))

    const level = BigInt(pow - precision - 1)
    const compressed = pow <= precision ? d : level * mod + d / (10n ** level)
    return compressed.toString(16).padStart(4, '0')
  }

  _decompressFixedPrecision(hex: string, precision = 3): BigInt {
    const factor = 10n ** BigInt(precision)
    const mod = 9n * factor
    const d = BigInt(hex)
    if (d < factor) {
      return d
    }
    return ((d - factor) % mod + factor) * (10n ** ((d - factor) / mod))
  }

  get expired(): Boolean {
    return Date.now() / 1000 > this.expireTs
  }

  get tooLateToLock(): Boolean {
    return Date.now() / 1000 > this.expireTs - (this.outChain === '0x003c' ? 45 : 25) * 60
  }

  toObject(): SwapData {
    return {
      encoded: this.encoded,
      version: this.version,
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
