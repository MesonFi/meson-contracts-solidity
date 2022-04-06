import type { Wallet } from '@ethersproject/wallet'

import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { Interface } from '@ethersproject/abi'
import { ERC20 } from '@mesonfi/contract-abis'

import { MesonClient, PostedSwapStatus, LockedSwapStatus } from './MesonClient'
import { AbstractChainApis, TronChainApis, Transaction } from './ChainApis'
import { SwapSigner } from './SwapSigner'

const AddressZero = '410000000000000000000000000000000000000000'

export class TronContract {
  readonly tronWeb: any
  #address: string
  #abi: object
  #instance: any

  constructor(address: string, abi: object, tronWeb: any) {
    this.tronWeb = tronWeb
    this.#address = address
    this.#abi = abi
    this.#instance = this.tronWeb.contract(abi, address)
  }

  get address() {
    return this.#instance.address
  }

  parseTransaction(tx: { input: string, value?: BigNumberish }) {
    const method = tx.input.substring(0, 8)
    if (!this.#instance.methodInstances[method]) {
      throw new Error('Contract method ' + method + ' not found');
    }
    const name = this.#instance.methodInstances[method].name
    const itfc = new Interface(this.#instance.abi)
    return itfc.decodeFunctionData(name, `0x${tx.input}`)
  }

  connect(signer: Wallet) {}
  queryFilter() {}

  async getShortCoinType() {
    return await this.#instance.getShortCoinType().call()
  }

  async supportedTokens() {
    const tokens = await this.#instance.supportedTokens().call()
    return tokens.map(t => this.tronWeb.address.fromHex(t))
  }

  async indexOfAddress(addr) {
    return await this.#instance.indexOfAddress(addr).call()
  }

  async balanceOf(token, addr) {
    return await this.#instance.balanceOf(token, addr).call()
  }

  async getPostedSwap(encoded: string | BigNumber) {
    const { initiator, provider, executed } = await this.#instance.getPostedSwap(encoded).call()
    return {
      executed,
      initiator: initiator === AddressZero ? undefined : this.tronWeb.address.fromHex(initiator),
      provider: provider === AddressZero ? undefined : this.tronWeb.address.fromHex(provider),
    }
  }

  async getLockedSwap(encoded: string | BigNumber, initiator: string) {
    const { provider, until } = await this.#instance.getLockedSwap(encoded, initiator).call()
    return {
      until,
      provider: provider === AddressZero ? undefined : this.tronWeb.address.fromHex(provider),
    }
  }

  async depositAndRegister(...args: any[]) {
    const hash = await this.#instance.depositAndRegister(...args).send()
    return { hash }
  }

  async deposit(...args: any[]) {
    const hash = await this.#instance.deposit(...args).send()
    return { hash }
  }

  async postSwap(...args: any[]) {
    const hash = await this.#instance.postSwap(...args).send()
    return { hash }
  }

  async lock(...args: any[]) {
    const hash = await this.#instance.lock(...args).send()
    return { hash }
  }

  async unlock(...args: any[]) {
    const hash = await this.#instance.unlock(...args).send()
    return { hash }
  }

  async release(...args: any[]) {
    const hash = await this.#instance.release(...args).send()
    return { hash }
  }

  async executeSwap(...args: any[]) {
    const hash = await this.#instance.executeSwap(...args).send()
    return { hash }
  }

  async cancelSwap(...args: any[]) {
    const hash = await this.#instance.cancelSwap(...args).send()
    return { hash }
  }
}

export class MesonClientTron extends MesonClient {
  readonly chainApis: AbstractChainApis
  readonly mesonInstance: any
  readonly tronWeb: any

  static async CreateForTron(mesonInstance: TronContract, swapSigner?: SwapSigner) {
    const shortCoinType = await mesonInstance.getShortCoinType()
    const client = new MesonClientTron(mesonInstance, shortCoinType)
    if (swapSigner) {
      client.setSwapSigner(swapSigner)
    }
    await client._getSupportedTokens()
    return client
  }

  constructor(mesonInstance: TronContract, shortCoinType: string) {
    super(mesonInstance, shortCoinType)
    this.mesonInstance = mesonInstance
    this.tronWeb = mesonInstance.tronWeb
    this.chainApis = new TronChainApis(this.tronWeb)
  }

  get address(): string {
    return this.mesonInstance.address
  }

  parseTransaction(tx: { input: string, value?: BigNumberish }) {
    return this.mesonInstance.parseTransaction(tx)  
  }

  onEvent() {}

  dispose() {}

  setSwapSigner(swapSigner: SwapSigner) {
    this._signer = swapSigner
  }

  async detectNetwork() {
    return await this.tronWeb.fullNode.isConnected()
  }

  async _getSupportedTokens() {
    this._tokens = await this.mesonInstance.supportedTokens()
  }

  getTokenIndex(addr: string) {
    return 1 + this._tokens.indexOf(addr)
  }

  async getBalance(addr: string) {
    const balance = await this.tronWeb.trx.getBalance(addr)
    return BigNumber.from(balance)
  }

  async balanceOfToken(token: string, addr: string) {
    const contract = this.tronWeb.contract(ERC20.abi, token)
    return await contract.balanceOf(addr).call()
  }

  async allowanceOfToken(token: string, addr: string) {
    const contract = this.tronWeb.contract(ERC20.abi, token)
    return await contract.allowance(addr, this.address).call()
  }

  async approveToken(token: string, value: BigNumberish) {
    const contract = this.tronWeb.contract(ERC20.abi, token)
    return await contract.approve(this.address, value).send()
  }

  async cancelSwap(encodedSwap: string, signer?: Wallet) {
    if (signer) {
      // TODO
      // return await this.mesonInstance.connect(signer).cancelSwap(encodedSwap)
    }
    return await this.mesonInstance.cancelSwap(encodedSwap)
  }
  async wait(txHash: string, confirmations: number = 1, ms: number = 60_000) {
    // TODO
    return await this.chainApis.getReceipt(txHash)
  }

  async isSwapPosted(encoded: string | BigNumber) {
    throw new Error('Unsupported')
    return false
  }

  async isSwapBonded(encoded: string | BigNumber) {
    throw new Error('Unsupported')
    return false
  }

  async isSwapLocked(encoded: string | BigNumber) {
    throw new Error('Unsupported')
    return false
  }

  async isSwapCancelled(encoded: string | BigNumber) {
    throw new Error('Unsupported')
    return false
  }

  async isSwapReleased(encoded: string | BigNumber) {
    throw new Error('Unsupported')
    return false
  }

  async getPostedSwap(encoded: string | BigNumber, initiatorToCheck?: string, block?: number): Promise<{
    status: PostedSwapStatus,
    initiator?: string,
    provider?: string,
  }> {
    throw new Error('Unsupported')
  }

  async getLockedSwap(encoded: string | BigNumber, initiator: string, block?: number): Promise<{
    status: LockedSwapStatus,
    provider?: string,
    until?: number
  }> {
    throw new Error('Unsupported')
  }
}
