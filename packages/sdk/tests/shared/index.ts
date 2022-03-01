import { BigNumberish } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { PartialSwapData, SwapData, SignedSwapRequestData, SignedSwapReleaseData } from '../..'

export function getPartialSwap({
  amount = parseUnits('1000', 6) as BigNumberish,
  fee = parseUnits('1', 6) as BigNumberish,
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
  amount = parseUnits('1000', 6) as BigNumberish,
  fee = parseUnits('1', 6) as BigNumberish,
  expireTs = Math.floor(Date.now() / 1000) + 5400,
  inChain = '0x0001',
  inToken = 2,
  outChain = '0x0002',
  outToken = 3,
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

interface ExtendedSignedSwapRequestData extends SignedSwapRequestData {
  digest: string
  mainnetDigest: string
  mainnetSignature: [string, string, number]
}

export const signedSwapRequestData = {
  encoded: '0x00003b9aca000000000000008140328700000f424000621d7ef8003c01003c01',
  initiator: '0x63FC2aD3d021a4D7e64323529a55a9442C444dA0',
  digest: '0x412a992ebcc7bc875222e7c69adf148b1fe145110d1fc9dc29f0a0268d7e54df',
  signature: [
    '0x59fa1a243a6003c21e50ceb2322cd8fcf09601e8dd4ac1b3baf54b93515fc29a',
    '0x2e6796f3c146d0ffd926a5898341c88d8947149917833647e1064c8644cd6a4c',
    28
  ],
  mainnetDigest: '0x62260aeff2d08a819fbcfe8eec99b98371255aa95c1413d56fc230be4377c9f5',
  mainnetSignature: [
    '0x895e02db52b697000e81a14be19ee8bcb9336487fca9f8418ade1baf2ee8cd1c',
    '0x6c73c13f9d6c5a257cda7d0ec85b6297d643da45c838eb03aa745b6435050fb8',
    28
  ]
} as ExtendedSignedSwapRequestData

interface ExtendedSignedSwapReleaseData extends SignedSwapReleaseData {
  digest: string
  mainnetDigest: string
  mainnetSignature: [string, string, number]
}

export const signedSwapReleaseData = {
  encoded: '0x00003b9aca000000000000008140328700000f424000621d7ef8003c01003c01',
  initiator: '0x63FC2aD3d021a4D7e64323529a55a9442C444dA0',
  recipient: '0xD1D84F0e28D6fedF03c73151f98dF95139700aa7',
  digest: '0x1e82a182a014967a4fa1f945fb72b191d3efa7a949c4e364064db05ecea46a3a',
  signature: [
    '0x0dcb3f16caecf58d5cb4f322205b2050197a570d5414b40ded15a25a0a0ed513',
    '0x77932f8852466065b981da7a3b7c06c178ee519638b23ec41e65456e6f73a712',
    27
  ],
  mainnetDigest: '0x3c651888c7d3e8ac90f7a335300c44a9d01c92f2c3d420d7a617dcc953eb49eb',
  mainnetSignature: [
    '0x02b12b894cbebe57d319ea6a02c8acecfcf5b7c3f637133d239ed18bf0ca3b1f',
    '0x032be9e60296b2c5757aedc1e900e8cac52bc048e0258e552d200abc7cefd25a',
    28
  ]
} as ExtendedSignedSwapReleaseData