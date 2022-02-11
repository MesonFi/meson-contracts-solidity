import { PartialSwapData } from '@mesonfi/sdk'

type OptionalSwapData = {
  inToken?: number,
  outToken?: number,
  amount?: string,
  fee?: string,
}

export function getDefaultSwap({
  inToken = 1,
  outToken = 1,
  amount = '100',
  fee = '10'
}: OptionalSwapData = {}): PartialSwapData {
  return {
    amount,
    salt: Math.floor(Math.random() * 10000),
    fee,
    inToken,
    outToken,
    recipient: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
  }
}

  export function getDefaultSwap2({
    inToken = 10,
    outToken = 1,
    amount = '100',
    fee = '10'
  }: OptionalSwapData = {}): PartialSwapData {
    return {
      amount,
      salt: Math.floor(Math.random() * 10000),
      fee,
      inToken,
      outToken,
      recipient: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
    }
}
