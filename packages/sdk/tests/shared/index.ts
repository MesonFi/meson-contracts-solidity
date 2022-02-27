import { PartialSwapData } from '../..'

export function getDefaultSwap({
  inToken = 1,
  outToken = 1,
  amount = '100',
  fee = '10'
} = {}): PartialSwapData {
  return {
    amount,
    salt: Math.floor(Math.random() * 10000),
    fee,
    inToken,
    outToken,
    recipient: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
  }
}
