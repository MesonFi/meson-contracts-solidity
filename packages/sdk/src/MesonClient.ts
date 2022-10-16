import {
  Contract,
  constants,
  providers,
  utils,
  type CallOverrides,
  type BigNumber,
  type BigNumberish
} from 'ethers'
import TronWeb from 'tronweb'

import type { Meson } from '@mesonfi/contract-types'
import { ERC20 } from '@mesonfi/contract-abis'

import { Rpc, Receipt } from './Rpc'
import { Swap } from './Swap'
import { SwapWithSigner } from './SwapWithSigner'
import { SwapSigner } from './SwapSigner'
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwap'
import * as adaptor from './adaptor'
import { AptosProvider, AptosWallet } from './adaptor/aptos/classes'
import { timer } from './utils'

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
  NoneOrAfterRunning = 0, // nothing found on chain
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
  #formatAddress: (string) => string

  readonly mesonInstance: Meson
  readonly rpc: Rpc
  readonly shortCoinType: string

  protected _signer: SwapSigner | null = null
  protected _tokens = []

  static async Create(mesonInstance: Meson, swapSigner?: SwapSigner) {
    const shortCoinType = await mesonInstance.getShortCoinType()
    const client = new MesonClient(mesonInstance, shortCoinType)
    if (swapSigner) {
      client.setSwapSigner(swapSigner)
    }
    await client._getSupportedTokens()
    return client
  }

  constructor(mesonInstance: any, shortCoinType: string) {
    if (mesonInstance instanceof Contract) {
      this.#formatAddress = addr => addr.toLowerCase()
    } else if (mesonInstance.provider instanceof AptosProvider) {
      this.#formatAddress = addr => addr
    } else {
      this.#formatAddress = addr => TronWeb.address.fromHex(addr)
    }

    this.mesonInstance = mesonInstance as Meson
    this.shortCoinType = shortCoinType
    this.rpc = new Rpc(this.provider)
  }

  get address(): string {
    return this.#formatAddress(this.mesonInstance.address)
  }

  async getSigner(): Promise<string> {
    return await this.mesonInstance.signer.getAddress()
  }

  setSwapSigner(swapSigner: SwapSigner) {
    this._signer = swapSigner
  }

  get provider() {
    return this.mesonInstance.provider as providers.JsonRpcProvider
  }

  async detectNetwork() {
    return await this.provider.detectNetwork()
  }

  async getBalance(addr: string) {
    return await this.provider.getBalance(this.#formatAddress(addr))
  }

  onEvent(listener: providers.Listener) {
    this.mesonInstance.on('*', listener)
  }

  dispose() {
    this.mesonInstance.removeAllListeners()
    this.mesonInstance.provider.removeAllListeners()
    if (this.mesonInstance.provider instanceof providers.WebSocketProvider) {
      this.mesonInstance.provider._websocket.removeAllListeners()
    }
  }

  async getShortCoinType(...overrides) {
    return await this.mesonInstance.getShortCoinType(...overrides)
  }

  async _getSupportedTokens(...overrides) {
    const { tokens, indexes } = await this.mesonInstance.getSupportedTokens(...overrides)
    this._tokens = tokens.map((addr, i) => ({ tokenIndex: indexes[i], addr: this.#formatAddress(addr) }))
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

  tokenIndexOf(addr: string) {
    return this._tokens.find(t => t.addr === this.#formatAddress(addr))?.tokenIndex
  }

  getTokenContract(tokenAddr: string) {
    return adaptor.getContract(tokenAddr, ERC20.abi, this.provider)
  }

  async poolOfAuthorizedAddr(addr: string, ...overrides) {
    return await this.mesonInstance.poolOfAuthorizedAddr(addr, ...overrides)
  }

  async ownerOfPool(poolIndex: number, ...overrides) {
    return this.#formatAddress(await this.mesonInstance.ownerOfPool(poolIndex, ...overrides))
  }

  async poolTokenBalance(token: string, addr: string, ...overrides) {
    return await this.mesonInstance.poolTokenBalance(token, addr, ...overrides)
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
    return this.mesonInstance.depositAndRegister(amount, poolTokenIndex)
  }

  async deposit(token: string, amount: BigNumberish) {
    const tokenIndex = this.tokenIndexOf(token)
    if (!tokenIndex) {
      throw new Error(`Token not supported`)
    }
    const signer = await this.getSigner()
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
    return this.mesonInstance.deposit(amount, poolTokenIndex)
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

  async postSwap(signedRequest: SignedSwapRequestData) {
    const signer = await this.getSigner()
    const poolIndex = await this.poolOfAuthorizedAddr(signer)
    if (!poolIndex) {
      throw new Error(`Address ${signer} not registered. Please call depositAndRegister first.`)
    }
    return this.mesonInstance.postSwap(
      signedRequest.encoded,
      signedRequest.signature[0],
      signedRequest.signature[1],
      signedRequest.signature[2],
      utils.solidityPack(['address', 'uint40'], [signedRequest.initiator, poolIndex])
    )
  }

  async bondSwap(encoded: BigNumberish) {
    const signer = await this.getSigner()
    const poolIndex = await this.poolOfAuthorizedAddr(signer)
    if (!poolIndex) {
      throw new Error(`Address ${signer} not registered. Please call depositAndRegister first.`)
    }
    return this.mesonInstance.bondSwap(encoded, poolIndex)
  }

  async lock(signedRequest: SignedSwapRequestData) {
    return this.mesonInstance.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
  }

  async unlock(signedRequest: SignedSwapRequestData) {
    return this.mesonInstance.unlock(signedRequest.encoded, signedRequest.initiator)
  }

  async release(signedRelease: SignedSwapReleaseData) {
    const { encoded, signature, initiator } = signedRelease
    let recipient = signedRelease.recipient
    if (encoded.substring(54, 58) === '00c3') {
      recipient = TronWeb.address.toHex(recipient).replace(/^41/, '0x')
    }
    return this.mesonInstance.release(encoded, ...signature, initiator, recipient)
  }

  async executeSwap(signedRelease: SignedSwapReleaseData, depositToPool: boolean = false) {
    const { encoded, signature } = signedRelease
    let recipient = signedRelease.recipient
    if (encoded.substring(54, 58) === '00c3') {
      recipient = TronWeb.address.toHex(recipient).replace(/^41/, '0x')
    }
    return this.mesonInstance.executeSwap(encoded, ...signature, recipient, depositToPool)
  }

  async cancelSwap(encodedSwap: string) {
    return await this.mesonInstance.cancelSwap(encodedSwap)
  }

  async wait(txHash: string, confirmations: number = 1, ms: number = 60_000) {
    if (!txHash) {
      throw new Error(`Invalid transaction hash: ${txHash}`)
    } else if (!(confirmations >= 1)) {
      throw new Error(`Invalid confirmations: ${confirmations}`)
    }

    let receipt
    let txBlockNumber
    const getTxBlockNumber = async () => {
      try {
        receipt = await this.rpc.getReceipt(txHash)
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
        const block = await this.rpc.getLatestBlock()
        onBlock(block.number)
      }, 3_000)

      timer(ms).then(() => done(new Error('Time out')))
    })
  }

  async _getPostedSwap(encoded: string | BigNumber, ...overrides) {
    const { initiator, poolOwner, exist } = await this.mesonInstance.getPostedSwap(encoded, ...overrides)
    return {
      exist,
      initiator: initiator.substring(2) === Zero ? undefined : initiator.replace(/^41/, '0x'), // convert tron hex address
      poolOwner: poolOwner.substring(2) === Zero ? undefined : this.#formatAddress(poolOwner)
    }
  }

  async _getLockedSwap(encoded: string | BigNumber, initiator: string, ...overrides) {
    const { poolOwner, until } = await this.mesonInstance.getLockedSwap(encoded, initiator, ...overrides)
    return {
      until,
      poolOwner: poolOwner.substring(2) === Zero ? undefined : this.#formatAddress(poolOwner)
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
        const blockNumber = await this.mesonInstance.provider.getBlockNumber()
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
        const blockNumber = await this.mesonInstance.provider.getBlockNumber()
        overrides.blockTag = blockNumber + block
      } else {
        overrides.blockTag = block
      }
    }
    const { poolOwner, until } = await this._getLockedSwap(encoded, initiator, overrides)
    if (!until) {
      return { status: LockedSwapStatus.NoneOrAfterRunning }
    } else if (until * 1000 < Date.now()) {
      return { status: LockedSwapStatus.ErrorExpired, poolOwner, until }
    } else {
      return { status: LockedSwapStatus.Locked, poolOwner, until }
    }
  }

  parseTransaction(tx: { input: string, value?: BigNumberish }) {
    return this.mesonInstance.interface.parseTransaction({ data: tx.input, value: tx.value })
  }
}
