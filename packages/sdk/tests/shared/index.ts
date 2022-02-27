import {
  PartialSwapData,
  SwapData,
  SignedSwapRequestData,
  SignedSwapReleaseData,
} from '../..'

export function getPartialSwap({
  amount = '100',
  fee = '10',
  inToken = 1,
  outToken = 1,
} = {}): PartialSwapData {
  return {
    amount,
    fee,
    inToken,
    outToken,
    recipient: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
  }
}

export function getSwap({
  amount = '100',
  fee = '10',
  expireTs = Math.floor(Date.now() / 1000) + 5400,
  inChain = '0x0000',
  inToken = 1,
  outChain = '0x0001',
  outToken = 1,
} = {}): SwapData {
  return {
    amount,
    fee,
    expireTs,
    inChain,
    inToken,
    outChain,
    outToken,
  }
}

export const signedSwapRequestData = {
  encoded: '0x000000000000000000000064000003c1000000000a00620a4c3e000101000101',
  initiator: '0x83bcD6A6a860EAac800A45BB1f4c30248e5Dc619',
  signature: [
    '0xc08846c00968ffbc5f8ed98432d043ac9a786816ee9b50daffa493b6560b1bf0',
    '0x712a685a28b53faa636237b215f40b125ec6e33bd590894dc38203c3a75b2bed',
    28
  ],
} as SignedSwapRequestData

export const signedSwapReleaseData = {
  encoded: '0x0000000000000000000000c800000d28000000000a00620b5b0e000101000101',
  initiator: '0x83bcd6a6a860eaac800a45bb1f4c30248e5dc619',
  recipient: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
  signature: [
    '0x171dd43bce19128b15f10c0aa4bddca8e4449a0c6bef5488e8208be4317f3bc9',
    '0x7f2f55df42529cf26aa5738b11debc57954f993aaa9693b2453a6923f6e6ce04',
    27
  ],
} as SignedSwapReleaseData
