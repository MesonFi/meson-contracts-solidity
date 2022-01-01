import { BytesLike } from 'ethers'

import { SwapRequest, PartialSwapRequest } from './SwapRequest'
import { SwapSigner } from './SwapSigner'

type MesonInterfaceConfig = {
  mesonAddress: BytesLike,
  chainId: BytesLike, // hex number
}

export class MesonInterface {
  private _signer: SwapSigner

  constructor (config: MesonInterfaceConfig) {
    this._signer = new SwapSigner(config.mesonAddress, config.chainId)
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
