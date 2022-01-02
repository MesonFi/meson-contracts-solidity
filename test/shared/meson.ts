import { BytesLike } from 'ethers'
import { PartialSwapRequest } from '@meson/sdk'

type OptionalSwapRequestData = {
  inToken?: BytesLike,
  outToken?: BytesLike,
}

export function getDefaultSwap({ inToken, outToken }: OptionalSwapRequestData = {}): PartialSwapRequest {
  return {
    inToken: inToken || '0x943f0cabc0675f3642927e25abfa9a7ae15e8672',
    amount: 100,
    outToken: outToken || '0x2151166224670b37ec76c8ee2011bbbf4bbf2a52',
    recipient: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
  }
}
