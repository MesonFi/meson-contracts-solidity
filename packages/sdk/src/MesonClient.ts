import {
  BigNumber,
  Contract,
  constants,
  providers,
  utils,
  type CallOverrides,
  type BigNumberish,
  type Wallet,
} from 'ethers'
import TronWeb from 'tronweb'

import type { Meson } from '@mesonfi/contract-types'
import { ERC20 } from '@mesonfi/contract-abis'

import { Rpc } from './Rpc'
import { Swap } from './Swap'
import { SwapWithSigner } from './SwapWithSigner'
import { SwapSigner } from './SwapSigner'
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwap'
import * as adaptors from './adaptors'
import AptosAdaptor from './adaptors/aptos/AptosAdaptor'

const Zero = constants.AddressZero.substring(2)

export enum PostedSwapStatus {
  NoneOrAfterRunning = 0, // nothing found on chain
  Requested = 0b0001,
  Bonded = 0b0010,
  Executed = 0b0100,
  Cancelled = 0b0101,
  Error = 0b1000,
  ErrorExpired = 0b1001,
  ErrorExpiredButBonded = 0b1010,
  ErrorMadeByOtherInitiator = 0b1100,
}

export enum LockedSwapStatus {
  None = 0,
  Locked = 0b0001,
  Released = 0b0100,
  Unlocked = 0b0101,
  Error = 0b1000,
  ErrorExpired = 0b1001,
}

export interface PartialSwapData {
  version?: number,
  amount: BigNumberish,
  salt?: string,
  fee: BigNumberish,
  inToken: number,
  outToken: number,
  recipient: string,
}

export class MesonClient {
  #mesonInstance: Meson

  readonly shortCoinType: string
  readonly addressFormat: adaptors.AddressFormat
  readonly rpc: Rpc

  protected _signer: SwapSigner | null = null
  protected _tokens = []

  static async Create(mesonInstance: Meson, swapSigner?: SwapSigner) {
    const shortCoinType = await mesonInstance.getShortCoinType()
    const mesonClient = new MesonClient(mesonInstance, shortCoinType)
    if (swapSigner) {
      mesonClient.setSwapSigner(swapSigner)
    }
    await mesonClient._getSupportedTokens()
    return mesonClient
  }

  static fromValue (value, tokenIndex) {
    return utils.formatUnits(value || '0', tokenIndex === 255 ? 4 : 6).replace(/\.0*$/, '')
  }

  static toValue (amount, tokenIndex) {
    return utils.parseUnits(amount || '0', tokenIndex === 255 ? 4 : 6)
  }

  static subValue (v1 = '0', v2 = '0') {
    return BigNumber.from(v1).sub(v2)
  }

  static initiatorFromAddress (address) {
    return `0x${TronWeb.address.toHex(address).substring(2)}`
  }

  static categoryFromSymbol (symbol) {
    if (!symbol) {
      return
    }
    const lowerCaseSymbol = symbol.toLowerCase()
    if (lowerCaseSymbol.includes('usdc')) {
      return 'usdc'
    } else if (lowerCaseSymbol.includes('usdt')) {
      return 'usdt'
    } else if (lowerCaseSymbol.includes('busd')) {
      return 'busd'
    } else if (lowerCaseSymbol.includes('pod')) {
      return 'pod'
    } else {
      return 'uct'
    }
  }

  constructor(mesonInstance: any, shortCoinType: string) {
    if (mesonInstance instanceof Contract) {
      this.addressFormat = 'ethers'
    } else if (mesonInstance.provider instanceof AptosAdaptor) {
      this.addressFormat = 'aptos'
    } else {
      this.addressFormat = 'tron'
    }

    this.#mesonInstance = mesonInstance as Meson
    this.shortCoinType = shortCoinType
    this.rpc = new Rpc(this.provider)
  }

  get mesonInstance() {
    return this.#mesonInstance
  }

  get address(): string {
    return this.formatAddress(this.#mesonInstance.address)
  }

  isAddress(addr: string): boolean {
    return adaptors.isAddress(this.addressFormat, addr)
  }

  formatAddress(addr: string): string {
    return adaptors.formatAddress(this.addressFormat, addr)
  }

  async getSignerAddress(): Promise<string> {
    const signer = this.#mesonInstance.signer as Wallet
    const address = signer.address || await signer.getAddress()
    return this.formatAddress(address)
  }

  setSwapSigner(swapSigner: SwapSigner) {
    this._signer = swapSigner
  }

  switchWallet (wallet) {
    this.#mesonInstance = this.#mesonInstance.connect(wallet)
  }

  get provider() {
    return this.#mesonInstance.provider as providers.JsonRpcProvider
  }

  get nodeUrl(): string {
    if (this.provider['nodeUrl']) {
      return this.provider['nodeUrl']
    } else if (this.provider instanceof providers.WebSocketProvider) {
      return this.provider._websocket?._url
    } else {
      return this.provider.connection?.url
    }
  }

  async detectNetwork() {
    return await this.provider.detectNetwork()
  }

  async getBalance(addr: string) {
    return await this.provider.getBalance(this.formatAddress(addr))
  }

  onEvent(listener: providers.Listener) {
    this.#mesonInstance.on('*', listener)
  }

  dispose() {
    this.#mesonInstance.removeAllListeners()
    this.#mesonInstance.provider.removeAllListeners()
    if (this.#mesonInstance.provider instanceof providers.WebSocketProvider) {
      this.#mesonInstance.provider._websocket.removeAllListeners()
    }
  }

  async getShortCoinType(...overrides) {
    return await this.#mesonInstance.getShortCoinType(...overrides)
  }

  async _getSupportedTokens(...overrides) {
    const { tokens, indexes } = await this.#mesonInstance.getSupportedTokens(...overrides)
    this._tokens = tokens.map((addr, i) => ({ tokenIndex: indexes[i], addr: this.formatAddress(addr) }))
  }

  getToken(index: number) {
    if (!index) {
      throw new Error(`Token index cannot be zero`)
    }
    return this._tokens.find(t => t.tokenIndex === index)
  }

  tokenAddr(index: number) {
    return this.getToken(index)?.addr
  }

  tokenIndexOf(addr: string): number | undefined {
    return this._tokens.find(t => t.addr === this.formatAddress(addr))?.tokenIndex
  }

  getTokenContract(tokenAddr: string, provider = this.provider) {
    return adaptors.getContract(tokenAddr, ERC20.abi, provider)
  }

  async getTokenBalance (owner, tokenIndex) {
    if (!this._tokens.length) {
      await this._getSupportedTokens({ from: owner })
    }
    const tokenAddr = this.tokenAddr(tokenIndex)
    if (!tokenAddr) {
      throw new Error(`No token for index ${tokenIndex}`)
    }
    const tokenContract = this.getTokenContract(tokenAddr)
    const rawValue = await (tokenContract as any).balanceOf(owner, { from: owner })
    const decimals = await (tokenContract as any).decimals({ from: owner })
    let value = BigNumber.from(rawValue)
    if (decimals > 6) {
      value = value.div(10 ** (decimals - 6))
    }
    return {
      value,
      display: MesonClient.fromValue(value, tokenIndex)
    }
  }

  async getAllowance (owner, tokenIndex) {
    if (!this._tokens.length) {
      await this._getSupportedTokens({ from: owner })
    }
    const tokenAddr = this.tokenAddr(tokenIndex)
    if (!tokenAddr) {
      throw new Error(`No token for index ${tokenIndex}`)
    }
    const tokenContract = this.getTokenContract(tokenAddr)
    const rawValue = await (tokenContract as any).allowance(owner, this.address, { from: owner })
    const decimals = await (tokenContract as any).decimals({ from: owner })
    let value = BigNumber.from(rawValue)
    if (decimals > 6) {
      value = value.div(10 ** (decimals - 6))
    }
    return {
      value,
      display: MesonClient.fromValue(value, tokenIndex)
    }
  }

  async poolOfAuthorizedAddr(addr: string, ...overrides) {
    return await this.#mesonInstance.poolOfAuthorizedAddr(addr, ...overrides)
  }

  async ownerOfPool(poolIndex: number, ...overrides) {
    return this.formatAddress(await this.#mesonInstance.ownerOfPool(poolIndex, ...overrides))
  }

  async poolTokenBalance(token: string, addr: string, ...overrides) {
    return await this.#mesonInstance.poolTokenBalance(token, addr, ...overrides)
  }

  async depositAndRegister(token: string, amount: BigNumberish, poolIndex: string) {
    const tokenIndex = this.tokenIndexOf(token)
    if (!tokenIndex) {
      throw new Error(`Token not supported`)
    }
    return this._depositAndRegister(amount, tokenIndex, poolIndex)
  }

  async _depositAndRegister(amount: BigNumberish, tokenIndex: number, poolIndex: string) {
    const poolTokenIndex = utils.solidityPack(['uint8', 'uint40'], [tokenIndex, poolIndex])
    return this.#mesonInstance.depositAndRegister(amount, poolTokenIndex)
  }

  async deposit(token: string, amount: BigNumberish) {
    const tokenIndex = this.tokenIndexOf(token)
    if (!tokenIndex) {
      throw new Error(`Token not supported`)
    }
    const signer = await this.getSignerAddress()
    const poolIndex = await this.poolOfAuthorizedAddr(signer)
    if (!poolIndex) {
      throw new Error(`Address ${signer} not registered. Please call depositAndRegister first.`)
    }
    const owner = await this.ownerOfPool(poolIndex)
    if (owner !== signer) {
      throw new Error(`The signer is not the owner of the LP pool.`)
    }
    return this._deposit(amount, tokenIndex, poolIndex)
  }

  async _deposit(amount: BigNumberish, tokenIndex: number, poolIndex: number) {
    const poolTokenIndex = utils.solidityPack(['uint8', 'uint40'], [tokenIndex, poolIndex])
    return this.#mesonInstance.deposit(amount, poolTokenIndex)
  }

  requestSwap(swap: PartialSwapData, outChain: string, lockPeriod: number = 5400) {
    if (!this._signer) {
      throw new Error('No swap signer assigned')
    }
    return new SwapWithSigner({
      ...swap,
      inChain: this.shortCoinType,
      outChain,
      expireTs: Math.floor(Date.now() / 1000) + lockPeriod,
    }, this._signer)
  }

  async postSwap(signedRequest: SignedSwapRequestData, poolIndex?: number, ...overrides) {
    if (typeof poolIndex === 'undefined') {
      const signer = await this.getSignerAddress()
      poolIndex = await this.poolOfAuthorizedAddr(signer)
      if (!poolIndex) {
        throw new Error(`Address ${signer} not registered. Please call depositAndRegister first.`)
      }
    }
    const sig = utils.splitSignature(signedRequest.signature)
    return this.#mesonInstance.postSwap(
      signedRequest.encoded,
      sig.r,
      sig.yParityAndS,
      utils.solidityPack(['address', 'uint40'], [signedRequest.initiator, poolIndex]),
      ...overrides
    )
  }

  async bondSwap(encoded: BigNumberish, ...overrides) {
    const signer = await this.getSignerAddress()
    const poolIndex = await this.poolOfAuthorizedAddr(signer)
    if (!poolIndex) {
      throw new Error(`Address ${signer} not registered. Please call depositAndRegister first.`)
    }
    return this.#mesonInstance.bondSwap(encoded, poolIndex, ...overrides)
  }

  async lock(signedRequest: SignedSwapRequestData, recipient?: string, ...overrides) {
    const sig = utils.splitSignature(signedRequest.signature)
    if (signedRequest.encoded.substring(54, 58) === '027d') { // to aptos
      return this.#mesonInstance.lock(signedRequest.encoded, sig.r, sig.yParityAndS, { initiator: signedRequest.initiator, recipient } as any, ...overrides)
    } else {
      return this.#mesonInstance.lock(signedRequest.encoded, sig.r, sig.yParityAndS, signedRequest.initiator, ...overrides)
    }
  }

  async unlock(signedRequest: SignedSwapRequestData, ...overrides) {
    return this.#mesonInstance.unlock(signedRequest.encoded, signedRequest.initiator, ...overrides)
  }

  async release(signedRelease: SignedSwapReleaseData, ...overrides) {
    const { encoded, initiator } = signedRelease
    let recipient = signedRelease.recipient
    if (encoded.substring(54, 58) === '00c3') { // to tron
      recipient = TronWeb.address.toHex(recipient).replace(/^41/, '0x')
    }
    const sig = utils.splitSignature(signedRelease.signature)
    return this.#mesonInstance.release(encoded, sig.r, sig.yParityAndS, initiator, recipient, ...overrides)
  }

  async executeSwap(signedRelease: SignedSwapReleaseData, depositToPool: boolean = false, ...overrides) {
    const { encoded } = signedRelease
    let recipient = signedRelease.recipient
    if (encoded.substring(54, 58) === '00c3') { // to tron
      recipient = TronWeb.address.toHex(recipient).replace(/^41/, '0x')
    } else if (encoded.substring(54, 58) === '027d') { // to aptos
      recipient = recipient.substring(0, 42)
    }
    const sig = utils.splitSignature(signedRelease.signature)
    return this.#mesonInstance.executeSwap(encoded, sig.r, sig.yParityAndS, recipient, depositToPool, ...overrides)
  }

  async cancelSwap(encodedSwap: string, ...overrides) {
    return await this.#mesonInstance.cancelSwap(encodedSwap, ...overrides)
  }

  async _getPostedSwap(encoded: string | BigNumber, ...overrides) {
    const { initiator, poolOwner, exist } = await this.#mesonInstance.getPostedSwap(encoded, ...overrides)
    return {
      exist,
      initiator: initiator && (initiator.substring(2) === Zero ? undefined : initiator.replace(/^41/, '0x')), // convert tron hex address
      poolOwner: poolOwner && (poolOwner.substring(2) === Zero ? undefined : this.formatAddress(poolOwner))
    }
  }

  async _getLockedSwap(encoded: string | BigNumber, initiator: string, ...overrides) {
    const { poolOwner, until } = await this.#mesonInstance.getLockedSwap(encoded, initiator, ...overrides)
    if (!until) {
      if (poolOwner && poolOwner.substring(2) !== Zero) {
        return { status: LockedSwapStatus.Released }
      } else {
        return { status: LockedSwapStatus.None }
      }
    }
    
    return {
      status: until * 1000 < Date.now() ? LockedSwapStatus.ErrorExpired : LockedSwapStatus.Locked,
      until,
      poolOwner: this.formatAddress(poolOwner)
    }
  }

  async getPostedSwap(encoded: string | BigNumber, initiatorToCheck?: string, block?: number): Promise<{
    status: PostedSwapStatus,
    initiator?: string,
    poolOwner?: string,
  }> {
    let expired
    try {
      const swap = Swap.decode(encoded)
      if (swap.expireTs * 1000 < Date.now()) {
        expired = true
      }
    } catch (err: any) {
      throw new Error('Invalid encoded. ' + err.message)
    }

    const overrides: CallOverrides = {}
    if (typeof block === 'number') {
      if (block <= 0) {
        const blockNumber = await this.#mesonInstance.provider.getBlockNumber()
        overrides.blockTag = blockNumber + block
      } else {
        overrides.blockTag = block
      }
    }
    const { initiator, poolOwner, exist } = await this._getPostedSwap(encoded, overrides)
    if (exist && !initiator) {
      return { status: PostedSwapStatus.Executed }
    } else if (!initiator) {
      return { status: PostedSwapStatus.NoneOrAfterRunning }
    } else if (initiatorToCheck && initiatorToCheck.toLowerCase() !== initiator.toLowerCase()) {
      return { status: PostedSwapStatus.ErrorMadeByOtherInitiator }
    } else if (!poolOwner) {
      if (expired) {
        return { status: PostedSwapStatus.ErrorExpired, initiator }
      } else {
        return { status: PostedSwapStatus.Requested, initiator }
      }
    } else {
      if (expired) {
        return { status: PostedSwapStatus.ErrorExpiredButBonded, initiator, poolOwner }
      } else {
        return { status: PostedSwapStatus.Bonded, initiator, poolOwner }
      }
    }
  }

  async getLockedSwap(encoded: string | BigNumber, initiator: string, block?: number): Promise<{
    status: LockedSwapStatus,
    poolOwner?: string,
    until?: number
  }> {
    const overrides: CallOverrides = {}
    if (typeof block === 'number') {
      if (block <= 0) {
        const blockNumber = await this.#mesonInstance.provider.getBlockNumber()
        overrides.blockTag = blockNumber + block
      } else {
        overrides.blockTag = block
      }
    }
    return await this._getLockedSwap(encoded, initiator, overrides)
  }

  parseTransaction(tx: { input: string, value?: BigNumberish }) {
    return this.#mesonInstance.interface.parseTransaction({ data: tx.input, value: tx.value })
  }
}
