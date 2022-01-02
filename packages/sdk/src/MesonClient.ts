import { Contract } from '@ethersproject/contracts'
import { BytesLike } from '@ethersproject/bytes'

import { SwapSigner } from './SwapSigner'
import { PartialSwapRequest } from './SwapRequest'
import { SwapRequestWithSigner } from './SwapRequestWithSigner'
import { SwapRequestWithProvider } from './SwapRequestWithProvider'

export class MesonClient {
  readonly mesonInstance: Contract
  readonly signer: SwapSigner
  private _coinType: BytesLike = ''

  static async Create(mesonInstance: Contract) {
    const client = new MesonClient(mesonInstance)
    await client.getNetworkConfig()
    return client
  }

  constructor (mesonInstance: Contract) {
    this.mesonInstance = mesonInstance
    this.signer = new SwapSigner(mesonInstance.address)
  }

  get coinType () {
    return this._coinType
  }

  get mesonAddress () {
    return this.mesonInstance.address
  }

  async getNetworkConfig () {
    this._coinType = await this.mesonInstance.getCoinType()
    const network = await this.mesonInstance.provider.getNetwork()
    this.signer.chainId = network.chainId
  }

  requestSwap(outChain: BytesLike, swap: PartialSwapRequest, lockPeriod: number = 5400) {
    return new SwapRequestWithSigner({
      ...swap,
      inChain: this.coinType,
      outChain,
      expireTs: Math.floor(Date.now() / 1000) + lockPeriod,
    }, this.signer)
  }

  parseRequest (serialized: string) {
    return SwapRequestWithProvider.FromSerialized(serialized, this.mesonInstance)
  }
}
