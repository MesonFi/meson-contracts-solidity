import { Wallet } from '@ethersproject/wallet'

import { SwapSigner } from './SwapSigner'
import { SwapRequest, SwapRequestData } from './SwapRequest'

export class SwapRequestWithSigner extends SwapRequest {
  readonly signer: SwapSigner

  constructor(req: SwapRequestData, signer: SwapSigner) {
    super(req)
    this.signer = signer
  }

  async signRequest(wallet: Wallet) {
    return await this.signer.signSwapRequest(this, wallet)
  }

  async signRelease(wallet: Wallet) {
    return await this.signer.signSwapRelease(this, wallet)
  }

  async serializeRequest(wallet: Wallet) {
    const signature = await this.signRequest(wallet)
    return JSON.stringify({
      ...this.toObject(),
      initiator: wallet.address.toLowerCase(),
      chainId: this.signer.chainId,
      mesonAddress: this.signer.mesonAddress,
      signature,
    })
  }

  async serializeRelease(wallet: Wallet) {
    const signature = await this.signRelease(wallet)
    return JSON.stringify({
      swapId: this.swapId,
      initiator: wallet.address.toLowerCase(),
      chainId: this.signer.chainId,
      mesonAddress: this.signer.mesonAddress,
      signature,
    })
  }
}
