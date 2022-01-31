import type { Wallet } from '@ethersproject/wallet'
import type { Signature } from './SwapSigner'

import { SwapSigner } from './SwapSigner'
import { SwapRequest, SwapRequestData } from './SwapRequest'
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwap'

export class SwapRequestWithSigner extends SwapRequest {
  readonly signer: SwapSigner
  readonly swapId: string

  constructor(req: SwapRequestData, signer: SwapSigner) {
    super(req)
    this.signer = signer
    this.swapId = signer.hashRequest(this.encode())
  }

  async signRequest(wallet: Wallet): Promise<Signature> {
    return await this.signer.signSwapRequest(this, wallet)
  }

  async signRelease(wallet: Wallet, recipient: string): Promise<Signature> {
    return await this.signer.signSwapRelease(this.swapId, recipient, wallet)
  }

  _exportBasics(initiator: string): SignedSwapRequestData {
    return {
      ...super.toObject(),
      swapId: this.swapId,
      initiator: initiator.toLowerCase(),
      chainId: this.signer.chainId,
      mesonAddress: this.signer.mesonAddress,
      signature: ['', '', 0]
    }
  }

  async exportRequest(wallet: Wallet, initiator = wallet.address): Promise<SignedSwapRequestData> {
    const signature = await this.signRequest(wallet)
    return {
      ...this._exportBasics(initiator),
      signature,
    }
  }

  async exportRelease(wallet: Wallet, recipient: string, initiator = wallet.address): Promise<SignedSwapReleaseData> {
    const signature = await this.signRelease(wallet, recipient)
    return {
      ...this._exportBasics(initiator),
      recipient,
      signature,
    }
  }

  async serializeRequest(wallet: Wallet): Promise<string> {
    return JSON.stringify(await this.exportRequest(wallet))
  }

  async serializeRelease(wallet: Wallet, recipient: string): Promise<string> {
    return JSON.stringify(await this.exportRelease(wallet, recipient))
  }
}
