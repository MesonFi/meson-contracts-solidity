import { Swap, SwapData } from './Swap'
import { SwapSigner } from './SwapSigner'
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwap'

export class SwapWithSigner extends Swap {
  readonly swapSigner: SwapSigner

  constructor(req: SwapData, swapSigner: SwapSigner) {
    super(req)
    this.swapSigner = swapSigner
  }

  async signForRequest(testnet?: boolean): Promise<SignedSwapRequestData> {
    const initiator = this.swapSigner.getAddress()
    const signature = await this.swapSigner.signSwapRequest(this.encoded, testnet)
    return {
      encoded: this.encoded,
      initiator,
      signature,
    }
  }

  async signForRelease(recipient: string, testnet?: boolean): Promise<SignedSwapReleaseData> {
    const initiator = this.swapSigner.getAddress()
    const signature = await this.swapSigner.signSwapRelease(this.encoded, recipient, testnet)
    return {
      encoded: this.encoded,
      initiator,
      recipient,
      signature,
    }
  }
}
