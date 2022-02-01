import type { Wallet } from '@ethersproject/wallet'
import type { Meson } from '@mesonfi/contract-types'

import { pack } from '@ethersproject/solidity'
import { keccak256 } from '@ethersproject/keccak256'
import { SwapSigner } from './SwapSigner'
import { SwapRequestWithSigner } from './SwapRequestWithSigner'
import { SignedSwapRequest, SignedSwapRelease } from './SignedSwap'

export interface PartialSwapRequest {
  inToken: number,
  amount: string,
  fee: string,
  outToken: number,
  recipient: string,
}

export class MesonClient {
  readonly mesonInstance: Meson
  readonly chainId: number
  readonly shortCoinType: string
  readonly signer: SwapSigner
  
  #tokens: string[] = []

  static async Create(mesonInstance: Meson) {
    const network = await mesonInstance.provider.getNetwork()
    const shortCoinType = await mesonInstance.getShortCoinType()
    const client = new MesonClient(mesonInstance, Number(network.chainId), shortCoinType)
    await client._getSupportedTokens()
    return client
  }

  constructor(mesonInstance: any, chainId: number, shortCoinType: string) {
    this.mesonInstance = mesonInstance as Meson
    this.chainId = chainId
    this.shortCoinType = shortCoinType
    this.signer = new SwapSigner(mesonInstance.address, chainId)
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

  requestSwap(outChain: string, swap: PartialSwapRequest, lockPeriod: number = 5400) {
    return new SwapRequestWithSigner({
      ...swap,
      inChain: this.shortCoinType,
      outChain,
      expireTs: Math.floor(Date.now() / 1000) + lockPeriod,
    }, this.signer)
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
    this._check(signedRequest)
    const providerAddress = await this.mesonInstance.signer.getAddress()
    const providerIndex = await this.mesonInstance.indexOfAddress(providerAddress)
    if (!providerIndex) {
      throw new Error(`Address ${providerAddress} not registered. Please call depositAndRegister first.`)
    }
    return this.mesonInstance.postSwap(
      signedRequest.encoded,
      signedRequest.signature[0],
      signedRequest.signature[1],
      pack(['uint8', 'address', 'uint40'], [
        signedRequest.signature[2],
        signedRequest.initiator,
        providerIndex
      ])
    )
  }

  async lock(signedRequest: SignedSwapRequest) {
    this._check(signedRequest)
    return this.mesonInstance.lock(
      signedRequest.encoded,
      ...signedRequest.signature,
      signedRequest.initiator
    )
  }

  async release(signedRelease: SignedSwapRelease) {
    this._check(signedRelease)
    return this.mesonInstance.release(
      signedRelease.encoded,
      signedRelease.domainHash,
      ...signedRelease.signature,
      signedRelease.recipient
    )
  }

  async executeSwap(signedRelease: SignedSwapRelease, depositToPool: boolean = false) {
    this._check(signedRelease)
    return this.mesonInstance.executeSwap(
      signedRelease.encoded,
      keccak256(signedRelease.recipient),
      ...signedRelease.signature,
      depositToPool
    )
  }

  private _check (swap: SignedSwapRequest) {
    if (this.chainId !== swap.chainId) {
      throw new Error('Mismatch chain id')
    } else if (this.mesonInstance.address !== swap.mesonAddress) {
      throw new Error('Mismatch messon address')
    }
  }

  async cancelSwap(swapId: string, signer?: Wallet) {
    if (signer) {
      return await this.mesonInstance.connect(signer).cancelSwap(swapId)
    }
    return await this.mesonInstance.cancelSwap(swapId)
  }

  async getSwap(swapId: string) {
    // return await this.mesonInstance.requests(swapId)
  }

  async getLockedSwap(encoded: string) {
    return await this.mesonInstance.getLockedSwap(encoded)
  }
}
