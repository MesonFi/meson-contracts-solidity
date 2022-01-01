import { Contract, BytesLike } from 'ethers'

import { SwapRequest, PartialSwapRequest } from './SwapRequest'
import { SwapSigner } from './SwapSigner'

export class MesonClient {
  private _mesonInstance: Contract
  private _signer: SwapSigner

  static async Create(mesonInstance: Contract) {
    const client = new MesonClient(mesonInstance)
    await client.getChainId()
    return client
  }

  constructor (mesonInstance: Contract) {
    this._mesonInstance = mesonInstance
    this._signer = new SwapSigner(mesonInstance.address)
  }

  async getChainId () {
    const network = await this._mesonInstance.provider.getNetwork()
    this._signer.chainId = network.chainId
  }

  requestSwap(outChain: BytesLike, swap: PartialSwapRequest, lockPeriod: number = 5400) {
    return new SwapRequest({
      ...swap,
      outChain,
      expireTs: Math.floor(Date.now() / 1000) + lockPeriod,
    })
  }

  get signer () {
    return this._signer
  }
}
