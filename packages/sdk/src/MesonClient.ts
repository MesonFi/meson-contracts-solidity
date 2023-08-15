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

import type { Meson, ERC20 as ERC20Contract } from '@mesonfi/contract-types'
import { ERC20 } from '@mesonfi/contract-abis'

import { Rpc } from './Rpc'
import { Swap } from './Swap'
import { SwapWithSigner } from './SwapWithSigner'
import { SwapSigner } from './SwapSigner'
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwap'
import * as adaptors from './adaptors'
import AptosAdaptor from './adaptors/aptos/AptosAdaptor'
import SuiAdaptor from './adaptors/sui/SuiAdaptor'

const Zero = constants.AddressZero.substring(2)
const AddressOne = '0x0000000000000000000000000000000000000001'

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
      mesonClient.swapSigner = swapSigner
    }
    await mesonClient.ready()
    return mesonClient
  }

  static fromSwapValue (value: BigNumberish) {
    return utils.formatUnits(value || '0', 6).replace(/\.0*$/, '')
  }

  static toSwapValue (amount: string) {
    return utils.parseUnits(amount || '0', 6)
  }

  static subValue (v1 = '0', v2 = '0') {
    return BigNumber.from(v1).sub(v2)
  }

  static initiatorFromAddress (address: string) {
    return `0x${TronWeb.address.toHex(address).substring(2)}`
  }

  static categoryFromSymbol (symbol: string) {
    if (!symbol) {
      return
    }
    const lowerCaseSymbol = symbol.toLowerCase()
    if (lowerCaseSymbol.includes('eth')) {
      return 'eth'
    } else if (lowerCaseSymbol.includes('usdc')) {
      return 'usdc'
    } else if (lowerCaseSymbol.includes('usdt')) {
      return 'usdt'
    } else if (lowerCaseSymbol.includes('busd')) {
      return 'busd'
    } else if (lowerCaseSymbol.includes('dai')) {
      return 'dai'
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
    } else if (mesonInstance.provider instanceof SuiAdaptor) {
      this.addressFormat = 'sui'
    } else {
      this.addressFormat = 'tron'
    }

    this.#mesonInstance = mesonInstance as Meson
    this.shortCoinType = shortCoinType
    this.rpc = new Rpc(this.provider)
  }

  async ready(...overrides: [CallOverrides?]) {
    if (!this._tokens.length) {
      const { tokens, indexes } = await this.#mesonInstance.getSupportedTokens(...overrides)
      this._tokens = tokens.map((addr, i) => ({ tokenIndex: indexes[i], addr: this.formatAddress(addr) }))
    }
  }

  dispose() {
    this.#mesonInstance.removeAllListeners()
    this.#mesonInstance.provider.removeAllListeners()
    if (this.#mesonInstance.provider instanceof providers.WebSocketProvider) {
      this.#mesonInstance.provider._websocket.removeAllListeners()
    }
  }

  isAddress(addr: string): boolean {
    return adaptors.isAddress(this.addressFormat, addr)
  }

  formatAddress(addr: string): string {
    return adaptors.formatAddress(this.addressFormat, addr)
  }

  get mesonInstance() {
    return this.#mesonInstance
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

  get address(): string {
    return this.formatAddress(this.#mesonInstance.address)
  }

  async getSignerAddress(): Promise<string> {
    const signer = this.#mesonInstance.signer as Wallet
    const address = signer.address || await signer.getAddress()
    return this.formatAddress(address)
  }

  set swapSigner(signer: SwapSigner) {
    this._signer = signer
  }

  set wallet (w: Wallet) {
    this.#mesonInstance = this.#mesonInstance.connect(w)
  }

  /// Tokens
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

  /// Contract instance
  getContractInstance(addr: string, abi: any, provider = this.provider) {
    return adaptors.getContract(addr, abi, provider)
  }

  getTokenContract(tokenAddr: string, provider = this.provider) {
    return this.getContractInstance(tokenAddr, ERC20.abi, provider) as ERC20Contract
  }

  /// Other utils
  parseTransaction(tx: { input: string, value?: BigNumberish }) {
    return this.#mesonInstance.interface.parseTransaction({ data: tx.input, value: tx.value })
  }

  onEvent(listener: providers.Listener) {
    this.#mesonInstance.on('*', listener)
  }

  /// General read methods
  async getShortCoinType(...overrides: [CallOverrides?]) {
    return await this.#mesonInstance.getShortCoinType(...overrides)
  }

  async getBalance(addr: string) {
    return await this.provider.getBalance(this.formatAddress(addr))
  }

  async poolOfAuthorizedAddr(addr: string, ...overrides: [CallOverrides?]) {
    return await this.#mesonInstance.poolOfAuthorizedAddr(addr, ...overrides)
  }

  async ownerOfPool(poolIndex: number, ...overrides: [CallOverrides?]) {
    return this.formatAddress(await this.#mesonInstance.ownerOfPool(poolIndex, ...overrides))
  }

  #formatBalance(raw: BigNumberish, decimals = 6) {
    let value = BigNumber.from(raw)
    if (decimals > 6) {
      value = value.div(10 ** (decimals - 6))
    }
    return {
      value,
      display: MesonClient.fromSwapValue(value)
    }
  }

  async #asyncGetTokenAddr(tokenIndex: number, ...overrides: [CallOverrides?]) {
    await this.ready(...overrides)
    const tokenAddr = this.tokenAddr(tokenIndex)
    if (!tokenAddr) {
      throw new Error(`No token for index ${tokenIndex}`)
    }
    return tokenAddr
  }

  async getTokenBalance(addr: string, tokenIndex: number) {
    if (tokenIndex === 255) {
      const rawValue = await this.getBalance(addr)
      return this.#formatBalance(rawValue, 18)
    }
    const tokenAddr = await this.#asyncGetTokenAddr(tokenIndex, { from: addr })
    const tokenContract = this.getTokenContract(tokenAddr)
    const rawValue = await tokenContract.balanceOf(addr, { from: addr })
    const decimals = await tokenContract.decimals({ from: addr })
    return this.#formatBalance(rawValue, decimals)
  }

  async getAllowance (addr: string, tokenIndex: number) {
    if (tokenIndex === 255) {
      return this.#formatBalance(BigNumber.from(2).pow(128).sub(1))
    }
    const tokenAddr = await this.#asyncGetTokenAddr(tokenIndex, { from: addr })
    const tokenContract = this.getTokenContract(tokenAddr)
    const rawValue = await tokenContract.allowance(addr, this.address, { from: addr })
    const decimals = await tokenContract.decimals({ from: addr })
    return this.#formatBalance(rawValue, decimals)
  }

  async getBalanceInPool(owner: string, tokenIndex: number) {
    const tokenAddr = await this.#asyncGetTokenAddr(tokenIndex, { from: owner })
    const rawValue = await this.#mesonInstance.poolTokenBalance(tokenAddr, owner, { from: owner })
    return this.#formatBalance(rawValue, 6)
  }

  async serviceFeeCollected(tokenIndex: number, ...overrides: [CallOverrides?]) {
    const rawValue = await this.#mesonInstance.serviceFeeCollected(tokenIndex, ...overrides)
    return this.#formatBalance(rawValue, 6)
  }

  async inContractTokenBalance(tokenIndex: number, ...overrides: [CallOverrides?]) {
    if (tokenIndex === 255) {
      const rawValue = await this.getBalance(this.address)
      return this.#formatBalance(rawValue, 18)
    }
    const tokenAddr = await this.#asyncGetTokenAddr(tokenIndex, ...overrides)
    const tokenContract = this.getTokenContract(tokenAddr)
    const rawValue = await tokenContract.balanceOf(this.address, ...overrides)
    const decimals = await tokenContract.decimals(...overrides)
    return this.#formatBalance(rawValue, decimals)
  }

  // only for aptos & sui
  async pendingTokenBalance(tokenIndex: number) {
    const rawValue = await (this.#mesonInstance as any).pendingTokenBalance(tokenIndex)
    return this.#formatBalance(rawValue, 6)
  }


  /// Write methods
  async transferToken(tokenIndex: number, recipient: string, value: BigNumberish, ...overrides: [CallOverrides?]) {
    if (tokenIndex === 255) {
      return this.#mesonInstance.signer.sendTransaction({
        ...overrides[0],
        to: recipient,
        value: BigNumber.from(value).mul(1e12)
      })
    }
    const tokenAddr = await this.#asyncGetTokenAddr(tokenIndex, { from: this.address })
    const tokenContract = this.getTokenContract(tokenAddr).connect(this.#mesonInstance.signer)
    const decimals = await tokenContract.decimals()
    if (decimals > 6) {
      value = BigNumber.from(value).mul(10 ** (decimals - 6))
    }
    return tokenContract.transfer(recipient, value, ...overrides)
  }

  async approveToken(tokenIndex: number, spender: string, value: BigNumberish, ...overrides: [CallOverrides?]) {
    if (tokenIndex === 255) {
      return
    }
    const tokenAddr = await this.#asyncGetTokenAddr(tokenIndex, { from: this.address })
    const tokenContract = this.getTokenContract(tokenAddr).connect(this.#mesonInstance.signer)
    const decimals = await tokenContract.decimals()
    if (decimals > 6) {
      value = BigNumber.from(value).mul(10 ** (decimals - 6))
    }
    return tokenContract.approve(spender, value, ...overrides)
  }

  async depositAndRegister(tokenIndex: number, value: BigNumberish, poolIndex: string) {
    const poolTokenIndex = utils.solidityPack(['uint8', 'uint40'], [tokenIndex, poolIndex])
    const opt: CallOverrides = {}
    if (tokenIndex === 255) {
      opt.value = BigNumber.from(value).mul(1e12)
    }
    return this.#mesonInstance.depositAndRegister(value, poolTokenIndex)
  }

  async deposit(tokenIndex: number, value: BigNumberish) {
    const signer = await this.getSignerAddress()
    const poolIndex = await this.poolOfAuthorizedAddr(signer)
    if (!poolIndex) {
      throw new Error(`Address ${signer} not registered. Please call depositAndRegister first.`)
    }
    const poolTokenIndex = utils.solidityPack(['uint8', 'uint40'], [tokenIndex, poolIndex])
    const opt: CallOverrides = {}
    if (tokenIndex === 255) {
      opt.value = BigNumber.from(value).mul(1e12)
    }
    return this.#mesonInstance.deposit(value, poolTokenIndex, opt)
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

  async postSwap(signedRequest: SignedSwapRequestData, poolIndex?: number, ...overrides: [CallOverrides?]) {
    if (typeof poolIndex === 'undefined') {
      const signer = await this.getSignerAddress()
      poolIndex = await this.poolOfAuthorizedAddr(signer)
      if (!poolIndex) {
        throw new Error(`Address ${signer} not registered. Please call depositAndRegister first.`)
      }
    }
    const sig = utils.splitSignature(signedRequest.signature)
    if (signedRequest.fromContract) {
      return this.#mesonInstance.postSwapFromContract(
        signedRequest.encoded,
        utils.solidityPack(['address', 'uint40'], [signedRequest.initiator, poolIndex]),
        signedRequest.fromContract,
        ...overrides
      )
    }
    return this.#mesonInstance.postSwap(
      signedRequest.encoded,
      sig.r,
      sig.yParityAndS,
      utils.solidityPack(['address', 'uint40'], [signedRequest.initiator, poolIndex]),
      ...overrides
    )
  }

  async postSwapFromInitiator(encoded: string, initiator: string, poolIndex: number, overrides?: CallOverrides) {
    const opt: CallOverrides = { ...overrides }
    const swap = Swap.decode(encoded)
    if (swap.inToken === 255) {
      opt.value = BigNumber.from(swap.amount).mul(1e12)
    }
    return this.#mesonInstance.postSwapFromInitiator(
      encoded,
      utils.solidityPack(['address', 'uint40'], [initiator, poolIndex]),
      opt
    )
  }

  async bondSwap(encoded: BigNumberish, ...overrides: [CallOverrides?]) {
    const signer = await this.getSignerAddress()
    const poolIndex = await this.poolOfAuthorizedAddr(signer)
    if (!poolIndex) {
      throw new Error(`Address ${signer} not registered. Please call depositAndRegister first.`)
    }
    return this.#mesonInstance.bondSwap(encoded, poolIndex, ...overrides)
  }

  async lockSwap(encoded: string, initiator: string, recipient?: string, ...overrides: [CallOverrides?]) {
    if (['027d', '0310'].includes(encoded.substring(54, 58))) { // to aptos or sui
      return this.#mesonInstance.lockSwap(encoded, { initiator, recipient } as any, ...overrides)
    } else {
      return this.#mesonInstance.lockSwap(encoded, initiator, ...overrides)
    }
  }

  async cancelSwap(encodedSwap: string, ...overrides: [CallOverrides?]) {
    return await this.#mesonInstance.cancelSwap(encodedSwap, ...overrides)
  }

  async unlock(signedRequest: SignedSwapRequestData, ...overrides: [CallOverrides?]) {
    return this.#mesonInstance.unlock(signedRequest.encoded, signedRequest.initiator, ...overrides)
  }

  async release(signedRelease: SignedSwapReleaseData, ...overrides: [CallOverrides?]) {
    const { encoded, initiator } = signedRelease
    let recipient = signedRelease.recipient
    if (encoded.substring(54, 58) === '00c3') { // to tron
      recipient = TronWeb.address.toHex(recipient).replace(/^41/, '0x')
    }
    const sig = utils.splitSignature(signedRelease.signature)
    return this.#mesonInstance.release(encoded, sig.r, sig.yParityAndS, initiator, recipient, ...overrides)
  }

  async executeSwap(signedRelease: SignedSwapReleaseData, depositToPool: boolean = false, ...overrides: [CallOverrides?]) {
    const { encoded } = signedRelease
    let recipient = signedRelease.recipient
    if (encoded.substring(54, 58) === '00c3') { // to tron
      recipient = TronWeb.address.toHex(recipient).replace(/^41/, '0x')
    } else if (['027d', '0310'].includes(encoded.substring(54, 58))) { // to aptos or sui
      recipient = recipient.substring(0, 42)
    }
    const sig = utils.splitSignature(signedRelease.signature)
    return this.#mesonInstance.executeSwap(encoded, sig.r, sig.yParityAndS, recipient, depositToPool, ...overrides)
  }

  async directExecuteSwap(signedRelease: SignedSwapReleaseData, ...overrides: [CallOverrides?]) {
    const { encoded, initiator } = signedRelease
    let recipient = signedRelease.recipient
    if (encoded.substring(54, 58) === '00c3') { // to tron
      recipient = TronWeb.address.toHex(recipient).replace(/^41/, '0x')
    } else if (['027d', '0310'].includes(encoded.substring(54, 58))) { // to aptos or sui
      recipient = recipient.substring(0, 42)
    }
    const sig = utils.splitSignature(signedRelease.signature)
    return this.#mesonInstance.directExecuteSwap(encoded, sig.r, sig.yParityAndS, initiator, recipient, ...overrides)
  }

  async directRelease(signedRelease: SignedSwapReleaseData, ...overrides: [CallOverrides?]) {
    const { encoded, initiator } = signedRelease
    let recipient = signedRelease.recipient
    if (encoded.substring(54, 58) === '00c3') { // to tron
      recipient = TronWeb.address.toHex(recipient).replace(/^41/, '0x')
    }
    const sig = utils.splitSignature(signedRelease.signature)
    return this.#mesonInstance.directRelease(encoded, sig.r, sig.yParityAndS, initiator, recipient, ...overrides)
  }

  /// Read methods for swap status
  async _getPostedSwap(encoded: string | BigNumber, ...overrides: [CallOverrides?]) {
    const { initiator, poolOwner, exist } = await this.#mesonInstance.getPostedSwap(encoded, ...overrides)
    return {
      exist,
      initiator: initiator && (initiator.substring(2) === Zero ? undefined : initiator.replace(/^41/, '0x')), // convert tron hex address
      poolOwner: poolOwner && (poolOwner.substring(2) === Zero ? undefined : this.formatAddress(poolOwner))
    }
  }

  async _getLockedSwap(encoded: string | BigNumber, initiator: string, ...overrides: [CallOverrides?]) {
    const { poolOwner, until } = await this.#mesonInstance.getLockedSwap(encoded, initiator, ...overrides)
    if (!until) {
      if (poolOwner && poolOwner.substring(2) !== Zero) {
        return { status: LockedSwapStatus.Released }
      } else {
        return { status: LockedSwapStatus.None }
      }
    }
    
    return {
      status: (until + 120) * 1000 < Date.now() ? LockedSwapStatus.ErrorExpired : LockedSwapStatus.Locked,
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
}
