import type { Wallet } from '@ethersproject/wallet'

import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { Interface } from '@ethersproject/abi'
import { ERC20 } from '@mesonfi/contract-abis'

import { MesonClient, PostedSwapStatus, LockedSwapStatus } from './MesonClient'
import { AbstractChainApis, TronChainApis, Receipt } from './ChainApis'
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

  get signer() {
    return this.tronWeb.defaultAddress.base58
  }

  parseTransaction(tx: { input: string, value?: BigNumberish }) {
    const method = tx.input.substring(0, 8)
    if (!this.#instance.methodInstances[method]) {
      throw new Error('Contract method ' + method + ' not found');
    }
    const name = this.#instance.methodInstances[method].name
    const itfc = new Interface(this.#instance.abi)
    return { name, args: itfc.decodeFunctionData(name, `0x${tx.input}`) }
  }

  connect(signer: Wallet) {
  }

  queryFilter() {
  }

  async getShortCoinType() {
    return await this.#instance.getShortCoinType().call({ from: this.signer })
  }

  async supportedTokens() {
    const tokens = await this.#instance.supportedTokens().call({ from: this.signer })
    return tokens.map(t => this.tronWeb.address.fromHex(t))
  }

  async indexOfAddress(addr) {
    return await this.#instance.indexOfAddress(addr).call({ from: this.signer })
  }

  async balanceOf(token, addr) {
    return await this.#instance.balanceOf(token, addr).call({ from: this.signer })
  }

  async getPostedSwap(encoded: string | BigNumber) {
    const { initiator, provider, executed } = await this.#instance.getPostedSwap(encoded).call({ from: this.signer })
    return {
      executed,
      initiator: initiator === AddressZero ? undefined : initiator.replace(/^41/, '0x'),
      provider: provider === AddressZero ? undefined : this.tronWeb.address.fromHex(provider),
    }
  }

  async getLockedSwap(encoded: string | BigNumber, initiator: string) {
    const { provider, until } = await this.#instance.getLockedSwap(encoded, initiator).call({ from: this.signer })
    return {
      until,
      provider: provider === AddressZero ? undefined : this.tronWeb.address.fromHex(provider),
    }
  }

  async depositAndRegister(...args: any[]) {
    const hash = await this.#instance.depositAndRegister(...args).send({ from: this.signer })
    return { hash }
  }

  async deposit(...args: any[]) {
    const hash = await this.#instance.deposit(...args).send({ from: this.signer })
    return { hash }
  }

  async postSwap(...args: any[]) {
    const hash = await this.#instance.postSwap(...args).send({ from: this.signer })
    return { hash }
  }

  async lock(...args: any[]) {
    const hash = await this.#instance.lock(...args).send({ from: this.signer })
    return { hash }
  }

  async unlock(...args: any[]) {
    const hash = await this.#instance.unlock(...args).send({ from: this.signer })
    return { hash }
  }

  async release(...args: any[]) {
    const hash = await this.#instance.release(...args).send({ from: this.signer })
    return { hash }
  }

  async executeSwap(...args: any[]) {
    const hash = await this.#instance.executeSwap(...args).send({ from: this.signer })
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

  override get address(): string {
    return this.mesonInstance.address
  }

  override getSigner(): Promise<string> {
    return this.mesonInstance.signer
  }

  override parseTransaction(tx: { input: string, value?: BigNumberish }) {
    return this.mesonInstance.parseTransaction(tx)
  }

  override onEvent() {
  }

  override dispose() {
  }

  override setSwapSigner(swapSigner: SwapSigner) {
    this._signer = swapSigner
  }

  override async detectNetwork() {
    return await this.tronWeb.fullNode.isConnected()
  }

  override async _getSupportedTokens() {
    this._tokens = await this.mesonInstance.supportedTokens()
  }

  override getTokenIndex(addr: string) {
    return 1 + this._tokens.indexOf(addr)
  }

  override async getBalance(addr: string) {
    const balance = await this.tronWeb.trx.getBalance(addr)
    return BigNumber.from(balance)
  }

  override async balanceOfToken(token: string, addr: string) {
    const contract = this.tronWeb.contract(ERC20.abi, token)
    return await contract.balanceOf(addr).call()
  }

  override async allowanceOfToken(token: string, addr: string) {
    const contract = this.tronWeb.contract(ERC20.abi, token)
    return await contract.allowance(addr, this.address).call()
  }

  override async approveToken(token: string, value: BigNumberish) {
    const contract = this.tronWeb.contract(ERC20.abi, token)
    return await contract.approve(this.address, value).send()
  }

  override async cancelSwap(encodedSwap: string, signer?: Wallet) {
    if (signer) {
      // TODO
      // return await this.mesonInstance.connect(signer).cancelSwap(encodedSwap)
    }
    return await this.mesonInstance.cancelSwap(encodedSwap)
  }

  override async wait(txHash: string, confirmations: number = 1, timeoutMs: number = 60_000) {
    return this._waitForBlock(
      txHash, confirmations, timeoutMs,
      (onBlock) => {
        const h = setInterval(async () => {
          const blockNumber = await this.chainApis.getBlockNumber()
          await onBlock(blockNumber)
        }, 3_000)
        return (onBlock) => {
          clearInterval(h)
        }
      })
  }

  override async isSwapPosted(encoded: string | BigNumber) {
    throw new Error('Unsupported')
    return false
  }

  override async isSwapBonded(encoded: string | BigNumber) {
    throw new Error('Unsupported')
    return false
  }

  override async isSwapLocked(encoded: string | BigNumber) {
    throw new Error('Unsupported')
    return false
  }

  override async isSwapCancelled(encoded: string | BigNumber) {
    throw new Error('Unsupported')
    return false
  }

  override async isSwapReleased(encoded: string | BigNumber) {
    throw new Error('Unsupported')
    return false
  }

  override async getPostedSwap(encoded: string | BigNumber, initiatorToCheck?: string, block?: number): Promise<{
    status: PostedSwapStatus,
    initiator?: string,
    provider?: string,
  }> {
    return await super.getPostedSwap(encoded, initiatorToCheck)
  }

  override async getLockedSwap(encoded: string | BigNumber, initiator: string, block?: number): Promise<{
    status: LockedSwapStatus,
    provider?: string,
    until?: number
  }> {
    return await super.getLockedSwap(encoded, initiator)
  }
}
