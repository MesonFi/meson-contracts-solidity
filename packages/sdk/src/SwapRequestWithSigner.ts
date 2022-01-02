import { Wallet } from '@ethersproject/wallet'

import { SwapSigner } from './SwapSigner'
import { SwapRequest, SwapRequestData } from './SwapRequest'

export class SwapRequestWithSigner extends SwapRequest {
  readonly signer: SwapSigner

  constructor(req: SwapRequestData, signer: SwapSigner) {
    super(req)
    this.signer = signer
  }

  async signRequest (wallet: Wallet) {
    return await this.signer.signSwapRequest(this, wallet)
  }

  async signRelease (wallet: Wallet) {
    return await this.signer.signSwapRelease(this.id(), wallet)
  }

  async serializeRequest (wallet: Wallet) {
    const swapObject = this.toObject()
    const signatures = await this.signRequest(wallet)
    return JSON.stringify({ ...swapObject, signatures })
  }

  async serializeRelease (wallet: Wallet) {
    const swapId = this.id()
    const signatures = await this.signRelease(wallet)
    return JSON.stringify({ swapId, signatures })
  }
}