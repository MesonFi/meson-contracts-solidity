import { Wallet } from '@ethersproject/wallet'

import { SwapSigner } from './SwapSigner'
import { SwapRequest, SwapRequestData } from './SwapRequest'
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwapRequest'

export class SwapRequestWithSigner extends SwapRequest {
  readonly signer: SwapSigner
  readonly swapId: string

  constructor(req: SwapRequestData, signer: SwapSigner) {
    super(req)
    this.signer = signer
    this.swapId = signer.getSwapId(req)
  }

  async signRequest(wallet: Wallet) {
    return await this.signer.signSwapRequest(this, wallet)
  }

  async signRelease(wallet: Wallet) {
    return await this.signer.signSwapRelease(this.swapId, wallet)
  }

  async exportRequest(wallet: Wallet, initiator = wallet.address) {
    const signature = await this.signRequest(wallet)
    return {
      ...this.toObject(),
      swapId: this.swapId,
      initiator: initiator.toLowerCase(),
      chainId: this.signer.chainId,
      mesonAddress: this.signer.mesonAddress,
      signature,
    } as SignedSwapRequestData
  }

  async exportRelease(wallet: Wallet, initiator = wallet.address) {
    const signature = await this.signRelease(wallet)
    const domainHash = this.signer.getDomainHash()
    return {
      swapId: this.swapId,
      initiator: initiator.toLowerCase(),
      chainId: this.signer.chainId,
      mesonAddress: this.signer.mesonAddress,
      domainHash,
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
