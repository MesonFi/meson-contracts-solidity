import { Contract } from '@ethersproject/contracts'
import { BytesLike } from '@ethersproject/bytes'

import { SwapSigner } from './SwapSigner'
import { SwapRequestWithSigner } from './SwapRequestWithSigner'
import { SignedSwapRequest } from './SignedSwapRequest'

export interface PartialSwapRequest {
  inToken: BytesLike,
  amount: string,
  outToken: BytesLike,
  recipient: BytesLike,
}

export class MesonClient {
  readonly mesonInstance: Contract
  readonly chainId: number
  readonly coinType: BytesLike
  readonly signer: SwapSigner

  static async Create(mesonInstance: Contract) {
    const network = await mesonInstance.provider.getNetwork()
    const coinType = await mesonInstance.getCoinType()
    return new MesonClient(mesonInstance, Number(network.chainId), coinType)
  }

  constructor(mesonInstance: Contract, chainId: number, coinType: BytesLike) {
    this.mesonInstance = mesonInstance
    this.chainId = chainId
    this.coinType = coinType
    this.signer = new SwapSigner(mesonInstance.address, chainId)
  }

  requestSwap(outChain: BytesLike, swap: PartialSwapRequest, lockPeriod: number = 5400) {
    return new SwapRequestWithSigner({
      ...swap,
      inChain: this.coinType,
      outChain,
      expireTs: Math.floor(Date.now() / 1000) + lockPeriod,
    }, this.signer)
  }

  private _check (swap: SignedSwapRequest) {
    if (this.chainId !== swap.chainId) {
      throw new Error('Mismatch chain id')
    } else if (this.mesonInstance.address !== swap.mesonAddress) {
      throw new Error('Mismatch messon address')
    }
  }

  async post(swap: SignedSwapRequest) {
    this._check(swap)
    return this.mesonInstance.postSwap(
      swap.encode(),
      swap.inToken,
      swap.initiator,
      ...swap.signature
    )
  }

  async execute(swap: SignedSwapRequest, signature: [string, string, number]) {
    this._check(swap)
    return this.mesonInstance.executeSwap(swap.swapId, ...signature)
  }
}
