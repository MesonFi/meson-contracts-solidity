import type { Wallet } from '@ethersproject/wallet'

import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { Interface } from '@ethersproject/abi'
import { ERC20 } from '@mesonfi/contract-abis'

import { MesonClient, PostedSwapStatus, LockedSwapStatus } from './MesonClient'
import { AbstractChainApis, TronChainApis, Receipt } from './ChainApis'
import { SwapSigner } from './SwapSigner'
import { timer } from './utils'

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

  connect(signer: Wallet) {}
  queryFilter() {}

  async getShortCoinType() {
    return await this.#instance.getShortCoinType().call({ from: this.signer })
  }

  async getSupportedTokens() {
    const { tokens, indexes } = await this.#instance.getSupportedTokens().call({ from: this.signer })
    return {
      tokens: tokens.map(t => this.tronWeb.address.fromHex(t)),
      indexes,
    }
  }

  async indexOfAddress(addr) {
    return await this.#instance.poolOfAuthorizedAddr(addr).call({ from: this.signer })
  }

  async balanceOf(token, addr) {
    return await this.#instance.poolTokenBalance(token, addr).call({ from: this.signer })
  }

  async getPostedSwap(encoded: string | BigNumber) {
    const { initiator, poolOwner, exist } = await this.#instance.getPostedSwap(encoded).call({ from: this.signer })
    return {
      exist,
      initiator: initiator === AddressZero ? undefined : initiator.replace(/^41/, '0x'),
      poolOwner: poolOwner === AddressZero ? undefined : this.tronWeb.address.fromHex(poolOwner),
    }
  }

  async getLockedSwap(encoded: string | BigNumber, initiator: string) {
    const { poolOwner, until } = await this.#instance.getLockedSwap(encoded, initiator).call({ from: this.signer })
    return {
      until,
      poolOwner: poolOwner === AddressZero ? undefined : this.tronWeb.address.fromHex(poolOwner),
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

  override onEvent() {}

  override dispose() {}

  override setSwapSigner(swapSigner: SwapSigner) {
    this._signer = swapSigner
  }

  override async detectNetwork() {
    return await this.tronWeb.fullNode.isConnected()
  }

  override async _getSupportedTokens() {
    const { tokens, indexes } = await this.mesonInstance.getSupportedTokens()
    this._tokens = tokens.map((addr, i) => ({ tokenIndex: indexes[i], addr }))
  }

  override getTokenIndex(addr: string) {
    return this._tokens.find(t => t.addr === addr)?.tokenIndex
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
  
  override async wait(txHash: string, confirmations: number = 1, ms: number = 60_000) {
    if (!txHash) {
      throw new Error(`Invalid transaction hash: ${txHash}`)
    } else if (!(confirmations >= 1)) {
      throw new Error(`Invalid confirmations: ${confirmations}`)
    }
    
    let receipt
    let txBlockNumber
    const getTxBlockNumber = async () => {
      try {
        receipt = await this.getReceipt(txHash)
        txBlockNumber = Number(receipt.blockNumber)
      } catch {}
    }

    return new Promise<Receipt>((resolve, reject) => {
      const done = (error?) => {
        clearInterval(h)

        if (error) {
          reject(error)
        } else {
          resolve(receipt)
        }
      }

      const onBlock = async blockNumber => {
        if (!txBlockNumber) {
          await getTxBlockNumber()
        }
        if (!txBlockNumber) {
          return
        }
        if (confirmations === 1) {
          return done()
        }
        if (blockNumber - txBlockNumber + 1 >= confirmations) {
          await getTxBlockNumber()
          if (blockNumber - txBlockNumber + 1 >= confirmations) {
            return done()
          }
        }
      }

      const h = setInterval(async () => {
        const block = await this.chainApis.getLatestBlock()
        onBlock(block.number)
      }, 3_000)

      timer(ms).then(() => done(new Error('Time out')))
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
