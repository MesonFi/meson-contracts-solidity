import { Swap, SwapData } from './Swap'
import { SwapSigner } from './SwapSigner'
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwap'

export class SwapWithSigner extends Swap {
  readonly swapSigner: SwapSigner

  constructor(req: SwapData, swapSigner: SwapSigner) {
    super(req)
    this.swapSigner = swapSigner
  }

  async signForRequest(): Promise<SignedSwapRequestData> {
    const initiator = this.swapSigner.getAddress()
    const signature = await this.swapSigner.signSwapRequest(this.encoded)
    return {
      ...this.toObject(),
      initiator,
      signature,
    }
  }

  async signForRelease(recipient: string): Promise<SignedSwapReleaseData> {
    const initiator = this.swapSigner.getAddress()
    const signature = await this.swapSigner.signSwapRelease(this.encoded, recipient)
    return {
      ...this.toObject(),
      initiator,
      recipient,
      signature,
    }
  }
}
