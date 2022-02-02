import type { Signature } from './SwapSigner'
import { Swap, SwapData } from './Swap'
import { SwapSigner } from './SwapSigner'
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwap'

export class SwapWithSigner extends Swap {
  readonly swapSigner: SwapSigner

  constructor(req: SwapData, swapSigner: SwapSigner) {
    super(req)
    this.swapSigner = swapSigner
  }

  async signRequest(): Promise<Signature> {
    return await this.swapSigner.signSwapRequest(this.encoded)
  }

  async signRelease(recipient: string): Promise<Signature> {
    return await this.swapSigner.signSwapRelease(this.encoded, recipient)
  }

  async exportRequest(): Promise<SignedSwapRequestData> {
    const initiator = this.swapSigner.getAddress()
    const signature = await this.signRequest()
    return {
      ...this.toObject(),
      initiator,
      signature,
    }
  }

  async exportRelease(recipient: string): Promise<SignedSwapReleaseData> {
    const initiator = this.swapSigner.getAddress()
    const signature = await this.signRelease(recipient)
    return {
      ...this.toObject(),
      initiator,
      recipient,
      signature,
    }
  }
}
