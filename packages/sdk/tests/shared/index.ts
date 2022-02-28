import { PartialSwapData, SwapData, SignedSwapRequestData, SignedSwapReleaseData } from '../..'

export function getPartialSwap({
  amount = '100',
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
  amount = '100',
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
  encoded: '0x00000000000000000000006409df491a000000000100621d3171000203000102',
  initiator: '0x63FC2aD3d021a4D7e64323529a55a9442C444dA0',
  digest: '0xb86f78f36b083e52e0ab1d6294822825eb15698e0653a301cef97d2186dd1cdb',
  signature: [
    '0x5e76d20683347bb36a5c574b393f5bfac58dc404beb620db2fd3fa1dd6cc202c',
    '0x42bb0ec584be446593d72a33e5ad1375bbbae318a88c45e3cfbbba2bd31d1910',
    28
  ],
  mainnetDigest: '0xb6860728a9b8bd71d04a44b71a7e718784951f6b2efe902843181565245daf7a',
  mainnetSignature: [
    '0xd07900f49e658fb982dd52bd41008881dd67ff81a79775e9b2466e2ff6751538',
    '0x26b70749c4a712e0d1f306b11e17a16328124f291583b3ee7540de363b380451',
    27
  ]
} as ExtendedSignedSwapRequestData

interface ExtendedSignedSwapReleaseData extends SignedSwapReleaseData {
  digest: string
  mainnetDigest: string
  mainnetSignature: [string, string, number]
}

export const signedSwapReleaseData = {
  encoded: '0x00000000000000000000006409df491a000000000100621d3171000203000102',
  initiator: '0x63FC2aD3d021a4D7e64323529a55a9442C444dA0',
  recipient: '0xD1D84F0e28D6fedF03c73151f98dF95139700aa7',
  digest: '0x3dcfad617ab248989e65cbbe6012cbecc4255167b5fab932cc09b9227dacd4d1',
  signature: [
    '0xb2f3a96fcc628f4d3da5688717dc54d7f6737f07fa63e564a6140ffe34435e33',
    '0x5e1f3393bb173dffbf1dabe888ee9a206701bf87d863c6c7527a0bb642e0093e',
    27
  ],
  mainnetDigest: '0xd33d4d66d4707238af7e62be11ee2a04846babbcfffd4f041cc03aaf4674d572',
  mainnetSignature: [
    '0x8857e4fb9d3129398ea9a76e67373b9936cf929cbe0f3690c8501e7973c82975',
    '0x4c957aa97b23de7470dca620fb9ebe1561ae3f9e2738913d2c83ad7c856189c2',
    27
  ]
} as ExtendedSignedSwapReleaseData