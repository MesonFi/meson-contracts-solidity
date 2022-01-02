import { Wallet } from '@ethersproject/wallet'

import { SwapSigner } from './SwapSigner'
import { SwapRequest, SwapRequestData } from './SwapRequest'
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwapRequest'

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

  async exportRequest(wallet: Wallet) {
    const signature = await this.signRequest(wallet)
    return {
      ...this.toObject(),
      initiator: wallet.address.toLowerCase(),
      chainId: this.signer.chainId,
      mesonAddress: this.signer.mesonAddress,
      signature,
    } as SignedSwapRequestData
  }

  async exportRelease(wallet: Wallet) {
    const signature = await this.signRelease(wallet)
    return {
      swapId: this.swapId,
      initiator: wallet.address.toLowerCase(),
      chainId: this.signer.chainId,
      mesonAddress: this.signer.mesonAddress,
      signature,
    } as SignedSwapReleaseData
  }

  async serializeRequest(wallet: Wallet) {
    return JSON.stringify(await this.exportRequest(wallet))
  }

  async serializeRelease(wallet: Wallet) {
    return JSON.stringify(await this.exportRelease(wallet))
  }
}
