import { PartialSwapData, SwapData, SignedSwapRequestData, SignedSwapReleaseData } from '../..'

export function getPartialSwap({
  amount = 100,
  fee = '1',
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
  amount = 100,
  fee = '1',
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
  encoded: '0x00000000006400000000000081403287000000000100621d7ef8003c01003c01',
  initiator: '0x63FC2aD3d021a4D7e64323529a55a9442C444dA0',
  digest: '0x7477468942a65aa88157a5e9a5e61366c86da4f1f61366af95e0ee6a0bc7dfa4',
  signature: [
    '0xdd80cd94dbddaaf732f36443c68d4f80bed319ef47b122ba8b4ee52f2b11ef69',
    '0x3e18c398cc809b465db2edc05cb00e672ab0d9eca463fee9691217a9fff327a3',
    27
  ],
  mainnetDigest: '0x1b6d08db26532e58c4167990d69d2ce796e2fe19eb3dd893cc9a97b5ffb52c70',
  mainnetSignature: [
    '0xd584b18515d515ae8f6958da32382d7c9b0558d80a868409fa096df410089feb',
    '0x0705849b58198a4b8683b07df1c02a477a9202ca09c8e39baae0f3f409cff366',
    28
  ]
} as ExtendedSignedSwapRequestData

interface ExtendedSignedSwapReleaseData extends SignedSwapReleaseData {
  digest: string
  mainnetDigest: string
  mainnetSignature: [string, string, number]
}

export const signedSwapReleaseData = {
  encoded: '0x00000000006400000000000081403287000000000100621d7ef8003c01003c01',
  initiator: '0x63FC2aD3d021a4D7e64323529a55a9442C444dA0',
  recipient: '0xD1D84F0e28D6fedF03c73151f98dF95139700aa7',
  digest: '0x706d6ea32ce96961dd3a03aa17b5e6726d217d9441aab0235da9f9b29c9f850c',
  signature: [
    '0xd1af4eb00bab5a2cfee90efb7027712bfaabf5b7ac96a6648eecec2f2399f04a',
    '0x413eb32ef8eeb8ab504f88b2a71d1d71103bddca68869717a798efb8173e1fa2',
    28
  ],
  mainnetDigest: '0xf6cb4f560dbe00b8791e9a74582ee1a47dec07be496c5427480ec8ef24cbc464',
  mainnetSignature: [
    '0x9fbb5265e5455af91b013f46f2b7e79430a64129b01c039dee0527f4864c0394',
    '0x39a7dd57b9ea2acfadfe4dbe120d0af321c0d915bd20adb315bc330d5e6cd998',
    28
  ]
} as ExtendedSignedSwapReleaseData