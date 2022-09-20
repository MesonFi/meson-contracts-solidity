import { BigNumberish, utils } from 'ethers'
import { PartialSwapData, SwapData, SignedSwapRequestData, SignedSwapReleaseData } from '../..'

export function getPartialSwap({
  amount = utils.parseUnits('1000', 6) as BigNumberish,
  fee = utils.parseUnits('1', 6) as BigNumberish,
  inToken = 1,
  outToken = 1,
} = {}): PartialSwapData {
  return {
    amount,
    fee,
    inToken,
    outToken,
    recipient: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
    salt: '0x80'
  }
}

export function getSwap({
  amount = utils.parseUnits('1000', 6) as BigNumberish,
  fee = utils.parseUnits('1', 6) as BigNumberish,
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
  testnet: true,
  encoded: '0x01003b9aca000000000000008140328700000f424000621d7ef8003c01003c01',
  initiator: '0x63FC2aD3d021a4D7e64323529a55a9442C444dA0',
  digest: '0xae2ef152547628db8ec4d935ea85828b120aca6ece438207f8dcaa842e69ff0f',
  signature: [
    '0x3cd0c5a3abe5214b5001e44d73d02b6fa7068f46256090c1043ebcd23483c2d0',
    '0x2d4038d42b0b247fefa54c123675a5a4984431c9033261f96f0084d42a5d52c7',
    28
  ],
  mainnetDigest: '0x778f68046136b3a42d3f715762b1e114926da740d4a3b9ada63d0af2964d6302',
  mainnetSignature: [
    '0x39e66dc0fcacad5f09cc92a92ec6e279c8445e68c9c417d1b67a7a268465bc73',
    '0x7bb7b56caedd14c12a10b2f71dabd50e46941de3c26b7039c8e1be5d3d4282e7',
    27
  ]
} as ExtendedSignedSwapRequestData

interface ExtendedSignedSwapReleaseData extends SignedSwapReleaseData {
  digest: string
  mainnetDigest: string
  mainnetSignature: [string, string, number]
}

export const signedSwapReleaseData = {
  testnet: true,
  encoded: '0x01003b9aca000000000000008140328700000f424000621d7ef8003c01003c01',
  initiator: '0x63FC2aD3d021a4D7e64323529a55a9442C444dA0',
  recipient: '0xD1D84F0e28D6fedF03c73151f98dF95139700aa7',
  digest: '0xf0331cc7c17b25ed6bfd9bd1ea3bc35d0afbc9dd6148d5c5ad585ad24fa3944c',
  signature: [
    '0x7b865163e2e513a187f8a6d9a73f7ae4a5026d510da2c48a486888ba54e4a483',
    '0x3b7e6ed417a721247b27dba3968e8b08179eb940ebb8e4865b574149e0cf7097',
    28
  ],
  mainnetDigest: '0x46e800b7c736d9fe41e74f6719ff6b1c230e04b3b47f58896714b6f14e371193',
  mainnetSignature: [
    '0xf8eabaa8bd8f26c5d0338a0b1fcc9e577bb33c77ede12c130ca39a506129a36f',
    '0x5ffde39331c79c9c37fa0497ae53bb4ba3e8ec3a8e59cc8f601d6a7dfbeccf6e',
    28
  ]
} as ExtendedSignedSwapReleaseData