import { Contract, Wallet, BytesLike } from 'ethers'

import { SwapSigner } from './SwapSigner'
import { PartialSwapRequest } from './SwapRequest'
import { SwapRequestWithSigner } from './SwapRequestWithSigner'
import { SwapRequestWithProvider } from './SwapRequestWithProvider'

export class MesonClient {
  readonly mesonInstance: Contract
  readonly signer: SwapSigner

  static async Create(mesonInstance: Contract) {
    const client = new MesonClient(mesonInstance)
    await client.getChainId()
    return client
  }

  constructor (mesonInstance: Contract) {
    this.mesonInstance = mesonInstance
    this.signer = new SwapSigner(mesonInstance.address)
  }

  get mesonAddress () {
    return this.mesonInstance.address
  }

  async getChainId () {
    const network = await this.mesonInstance.provider.getNetwork()
    this.signer.chainId = network.chainId
  }

  requestSwap(outChain: BytesLike, swap: PartialSwapRequest, lockPeriod: number = 5400) {
    return new SwapRequestWithSigner({
      ...swap,
      outChain,
      expireTs: Math.floor(Date.now() / 1000) + lockPeriod,
    }, this.signer)
  }

  parseRequest (serialized: string) {
    return SwapRequestWithProvider.FromSerialized(serialized, this.mesonInstance)
  }
}
