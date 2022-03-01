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
  digest: '0x36da22441182476cf572b963afb9b9aa26012de89fe12b50deec5cf5c9a1d33f',
  signature: [
    '0x88f81c46596d7edcd02438e4bd35b5d6e9d1adab50e97a1cb3e7f399e42c1220',
    '0x187155578f2acdc41200f9acf1dff7951f7eace6d00515b1b5af3453b704c50c',
    28
  ],
  mainnetDigest: '0xb09c9222161b54a8d5d9fb9b9e02cb872e9d53fc7e38886341fdb9c3218ea136',
  mainnetSignature: [
    '0xbd2ae38313d1ee8e99c4ff5e2f074a241cbd6c9051ee10e580593ab8060c98d4',
    '0x49be649003648f92d33fabbb9d0c516e4806a5f6b1caed1201bc7fced11432ac',
    28
  ]
} as ExtendedSignedSwapReleaseData