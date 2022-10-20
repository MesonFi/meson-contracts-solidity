import { Swap, SwapData } from './Swap'
import { SwapSigner } from './SwapSigner'
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwap'

export class SwapWithSigner extends Swap {
  readonly swapSigner: SwapSigner

  constructor(req: SwapData, swapSigner: SwapSigner) {
    super(req)
    this.swapSigner = swapSigner
  }

  async signForRequest(testnet: boolean): Promise<SignedSwapRequestData> {
    const signature = await this.swapSigner.signSwapRequest(this.encoded, testnet)
    const initiator = this.swapSigner.getAddress()
    const data: SignedSwapRequestData = {
      encoded: this.encoded,
      initiator,
      signature,
    }
    if (testnet) {
      data.testnet = true
    }
    return data
  }

  async signForRelease(recipient: string, testnet: boolean): Promise<SignedSwapReleaseData> {
    const signature = await this.swapSigner.signSwapRelease(this.encoded, recipient, testnet)
    const initiator = this.swapSigner.getAddress()
    const data: SignedSwapReleaseData = {
      encoded: this.encoded,
      initiator,
      recipient,
      signature,
    }
    if (testnet) {
      data.testnet = true
    }
    return data
  }
}
