import type { Signature } from './SwapSigner'
import { Swap, SwapData } from './Swap'
import { SwapSigner } from './SwapSigner'
import { SignedSwapRequestData, SignedSwapReleaseData } from './SignedSwap'

export class SwapWithSigner extends Swap {
  readonly signer: SwapSigner

  constructor(req: SwapData, signer: SwapSigner) {
    super(req)
    this.signer = signer
  }

  async signRequest(): Promise<Signature> {
    return await this.signer.signSwapRequest(this.encoded)
  }

  async signRelease(recipient: string): Promise<Signature> {
    return await this.signer.signSwapRelease(this.encoded, recipient)
  }

  async exportRequest(): Promise<SignedSwapRequestData> {
    const initiator = await this.signer.getAddress()
    const signature = await this.signRequest()
    return {
      ...this.toObject(),
      initiator,
      signature,
    }
  }

  async exportRelease(recipient: string): Promise<SignedSwapReleaseData> {
    const initiator = await this.signer.getAddress()
    const signature = await this.signRelease(recipient)
    return {
      ...this.toObject(),
      initiator,
      recipient,
      signature,
    }
  }
}
