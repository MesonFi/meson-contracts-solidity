import { BytesLike } from 'ethers'
import { PartialSwapRequest } from '@mesonfi/sdk'

type OptionalSwapRequestData = {
  inToken?: BytesLike,
  outToken?: BytesLike,
}

export function getDefaultSwap({ inToken, outToken }: OptionalSwapRequestData = {}): PartialSwapRequest {
  return {
    inToken: inToken || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    amount: '100',
    outToken: outToken || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    recipient: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
  }
}
