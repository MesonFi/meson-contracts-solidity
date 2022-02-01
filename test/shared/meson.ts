import { PartialSwapRequest } from '@mesonfi/sdk'

type OptionalSwapRequestData = {
  inToken?: number,
  outToken?: number,
  amount?: string,
  fee?: string,
}

export function getDefaultSwap({
  inToken = 1,
  outToken = 1,
  amount = '100',
  fee = '1'
}: OptionalSwapRequestData = {}): PartialSwapRequest {
  return {
    inToken,
    amount,
    fee,
    outToken,
    recipient: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
  }
}
