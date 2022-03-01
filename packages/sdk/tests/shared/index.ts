import { PartialSwapData, SwapData, SignedSwapRequestData, SignedSwapReleaseData } from '../..'

export function getPartialSwap({
  amount = 1000,
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
  amount = 1000,
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
  encoded: '0x0000000003e800000000000081403287000000000100621d7ef8003c01003c01',
  initiator: '0x63FC2aD3d021a4D7e64323529a55a9442C444dA0',
  digest: '0x5a520ce810bfbe1608d6d31326d1ce6085d6eeaff8cbb08efe687f425fc3f99f',
  signature: [
    '0xba30cf35f1bad01751af60b00ce7912e8d2ab69286b2125f2f9ff7bf18605b5f',
    '0x3992f77437133fa2d2c20cdc057ce53a1f5193cb6573ec2993a8bb6643dd8627',
    28
  ],
  mainnetDigest: '0x7a282d244ab253a3c3ca393a96a91ddf2296896e27317788d8fff7412eeb248f',
  mainnetSignature: [
    '0x6028bdad3eff9f83b42364184e7d009ecd864ef88e4a1576fb09dc1e22b9de15',
    '0x0d428ab598e504d8193e64e1ae46883cf462aed7adacc97a9daacfaec11b68c3',
    27
  ]
} as ExtendedSignedSwapRequestData

interface ExtendedSignedSwapReleaseData extends SignedSwapReleaseData {
  digest: string
  mainnetDigest: string
  mainnetSignature: [string, string, number]
}

export const signedSwapReleaseData = {
  encoded: '0x0000000003e800000000000081403287000000000100621d7ef8003c01003c01',
  initiator: '0x63FC2aD3d021a4D7e64323529a55a9442C444dA0',
  recipient: '0xD1D84F0e28D6fedF03c73151f98dF95139700aa7',
  digest: '0x4d6b782744a6c3675d0cef6d87baf380c3df2286ae6eef7816b8cec04a4da473',
  signature: [
    '0xb3a991e53dfc320b3dc0919e00a2f3d83c4034b7473136b4736dadc7782cce3a',
    '0x79c24cb0805df4147458ddeeba8d963c4be05336156106d8ddf9ce7a0cb11af5',
    28
  ],
  mainnetDigest: '0x0f2f859b0759e339781b54c2d7b433fdfb1425f62234c455d98a36dcc015f93a',
  mainnetSignature: [
    '0x0cbeea0764b3d95f1c5feeb35f7e0def6dedd8cd5799044bbbed3cfd6469cab7',
    '0x287939f3ac22206b57408fd563722a64c0759c017131a48bae7323fce5452f4c',
    28
  ]
} as ExtendedSignedSwapReleaseData