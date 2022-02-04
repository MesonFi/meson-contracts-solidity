import type { BigNumber } from "@ethersproject/bignumber";
import type { Wallet } from '@ethersproject/wallet'
import type { Meson } from '@mesonfi/contract-types'
import { pack } from '@ethersproject/solidity'
import { keccak256 } from '@ethersproject/keccak256'
import { AddressZero } from '@ethersproject/constants'

import { Swap } from './Swap'
import { SwapWithSigner } from './SwapWithSigner'
import { SwapSigner } from './SwapSigner'
import { SignedSwapRequest, SignedSwapRelease } from './SignedSwap'

export enum PostedSwapStatus {
  None = 0, // nothing found on chain
  Requested = 0b0001,
  Bonded = 0b0010,
  Executed = 0b0100,
  Cancelled = 0b0101,
  Error = 0b1000,
  ErrorExpired = 0b1001,
  ErrorMadeByOthers = 0b1010,
}

export enum LockedSwapStatus {
  None = 0, // nothing found on chain
  Locked = 0b0001,
  Released = 0b0100,
  Unlocked = 0b0101,
  Error = 0b1000,
  ErrorExpired = 0b1001,
  ErrorMadeForOthers = 0b1010,
}

export interface PartialSwapData {
  amount: string,
  salt?: number,
  fee: string,
  inToken: number,
  outToken: number,
}

export class MesonClient {
  readonly mesonInstance: Meson
  readonly shortCoinType: string
  
  #signer: SwapSigner | null = null
  #tokens: string[] = []

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
    this.mesonInstance = mesonInstance as Meson
    this.shortCoinType = shortCoinType
  }

  setSwapSigner (swapSigner: SwapSigner) {
    this.#signer = swapSigner
  }

  async _getSupportedTokens () {
    const tokens = await this.mesonInstance.supportedTokens()
    this.#tokens = tokens.map(addr => addr.toLowerCase())
  }

  token (index: number) {
    if (!index) {
      throw new Error(`Token index cannot be zero`)
    }
    return this.#tokens[index - 1] || ''
  }

  requestSwap(swap: PartialSwapData, outChain: string, lockPeriod: number = 5400) {
    if (!this.#signer) {
      throw new Error('No swap signer assigned')
    }
    return new SwapWithSigner({
      ...swap,
      inChain: this.shortCoinType,
      outChain,
      expireTs: Math.floor(Date.now() / 1000) + lockPeriod,
    }, this.#signer)
  }

  async depositAndRegister(token: string, amount: string, providerIndex: string) {
    const tokenIndex = 1 + this.#tokens.indexOf(token.toLowerCase())
    if (!tokenIndex) {
      throw new Error(`Token not supported`)
    }
    return this._depositAndRegister(amount, tokenIndex, providerIndex)
  }

  async _depositAndRegister(amount: string, tokenIndex: number, providerIndex: string) {
    const balanceIndex = pack(['uint8', 'uint40'], [tokenIndex, providerIndex])
    return this.mesonInstance.depositAndRegister(amount, balanceIndex)
  }

  async deposit(token: string, amount: string) {
    const tokenIndex = 1 + this.#tokens.indexOf(token.toLowerCase())
    if (!tokenIndex) {
      throw new Error(`Token not supported`)
    }
    const providerAddress = await this.mesonInstance.signer.getAddress()
    const providerIndex = await this.mesonInstance.indexOfAddress(providerAddress)
    if (!providerIndex) {
      throw new Error(`Address ${providerAddress} not registered. Please call depositAndRegister first.`)
    }
    return this._deposit(amount, tokenIndex, providerIndex)
  }

  async _deposit(amount: string, tokenIndex: number, providerIndex: number) {
    const balanceIndex = pack(['uint8', 'uint40'], [tokenIndex, providerIndex])
    return this.mesonInstance.deposit(amount, balanceIndex)
  }

  async postSwap(signedRequest: SignedSwapRequest) {
    const providerAddress = await this.mesonInstance.signer.getAddress()
    const providerIndex = await this.mesonInstance.indexOfAddress(providerAddress)
    if (!providerIndex) {
      throw new Error(`Address ${providerAddress} not registered. Please call depositAndRegister first.`)
    }
    return this.mesonInstance.postSwap(
      signedRequest.encoded,
      signedRequest.signature[0],
      signedRequest.signature[1],
      signedRequest.signature[2],
      pack(['address', 'uint40'], [
        signedRequest.initiator,
        providerIndex
      ])
    )
  }

  async lock(signedRequest: SignedSwapRequest) {
    return this.mesonInstance.lock(
      signedRequest.encoded,
      ...signedRequest.signature,
      signedRequest.initiator
    )
  }

  async release(signedRelease: SignedSwapRelease) {
    return this.mesonInstance.release(
      signedRelease.encoded,
      ...signedRelease.signature,
      signedRelease.recipient
    )
  }

  async executeSwap(signedRelease: SignedSwapRelease, depositToPool: boolean = false) {
    return this.mesonInstance.executeSwap(
      signedRelease.encoded,
      keccak256(signedRelease.recipient),
      ...signedRelease.signature,
      depositToPool
    )
  }

  async cancelSwap(swapId: string, signer?: Wallet) {
    if (signer) {
      return await this.mesonInstance.connect(signer).cancelSwap(swapId)
    }
    return await this.mesonInstance.cancelSwap(swapId)
  }

  async getPostedSwap(encoded: string | BigNumber): Promise<{
    status: PostedSwapStatus,
    initiator?: string,
    provider?: string,
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
    
    const { initiator, provider, executed } = await this.mesonInstance.getPostedSwap(encoded)
    if (executed) {
      // could be executed for others; need to check events
      return { status: PostedSwapStatus.Executed }
    } else if (initiator === AddressZero) {
      // could be executed or cancelled; need to check events
      return { status: PostedSwapStatus.None }
    } else if (expired) {
      return { status: PostedSwapStatus.ErrorExpired, initiator }
    } else if (provider === AddressZero) {
      return { status: PostedSwapStatus.Requested, initiator }
    } else {
      return { status: PostedSwapStatus.Bonded, initiator, provider }
    }
  }

  async getLockedSwap(encoded: string | BigNumber): Promise<{
    status: LockedSwapStatus,
    initiator?: string,
    provider?: string,
    until?: number
  }> {
    const { initiator, provider, until } = await this.mesonInstance.getLockedSwap(encoded)
    if (!until) {
      // could be released or cancelled; need to check events
      return { status: LockedSwapStatus.None }
    } else if (until * 1000 < Date.now()) {
      return { status: LockedSwapStatus.ErrorExpired, initiator, provider, until }
    } else {
      return { status: LockedSwapStatus.Locked, initiator, provider, until }
    }
  }
}
