import { expect } from 'chai'

import {
  SignedSwapRequest,
  SignedSwapRequestData,
  SignedSwapRelease,
  SignedSwapReleaseData,
} from '../src'

const signedSwapRequestData = {
  encoded: '0x000000000000000000000064000003c1000000000a00620a4c3e000101000101',
  initiator: '0x83bcD6A6a860EAac800A45BB1f4c30248e5Dc619',
  signature: [
    '0xc08846c00968ffbc5f8ed98432d043ac9a786816ee9b50daffa493b6560b1bf0',
    '0x712a685a28b53faa636237b215f40b125ec6e33bd590894dc38203c3a75b2bed',
    28
  ],
} as SignedSwapRequestData

describe('SignedSwapRequest', () => {
  const signedRequest = new SignedSwapRequest(signedSwapRequestData)

  describe('#constructor', () => {
    it('rejects if missing encoded', () => {
      const cloned = { ...signedSwapRequestData, encoded: '' }
      expect(() => new SignedSwapRequest(cloned)).to.throw('Missing encoded')
    })
    it('rejects if missing initiator', () => {
      const cloned = { ...signedSwapRequestData, initiator: '' }
      expect(() => new SignedSwapRequest(cloned)).to.throw('Missing initiator')
    })
    it('rejects if missing signature', () => {
      const cloned = { ...signedSwapRequestData, signature: undefined }
      expect(() => new SignedSwapRequest(cloned)).to.throw('Missing signature')
    })
    it('creates a SignedSwapRequest', async () => {
      const signedRequest = new SignedSwapRequest(signedSwapRequestData)
      expect(signedRequest.encoded).to.equal(signedSwapRequestData.encoded)
      expect(signedRequest.initiator).to.equal(signedSwapRequestData.initiator.toLowerCase())
      expect(signedRequest.signature).to.equal(signedSwapRequestData.signature)
    })
  })

  describe('#getDigest', () => {
    it('generates digest for testnet & mainnet', async () => {
      expect(signedRequest.getDigest(true)).to.equal('0xe51e4bc1c03aaa02b2482d3b4d688eb33f640cf7bae316c7f652e684e34a43b5')
      expect(signedRequest.getDigest(false)).to.equal('0x71276bfb0b3f0beb0564997742671cee2fe5ab42e5dafbf749f402424e3e64ac')
    })
  })

  describe('#checkSignature', () => {
    it('validates the signature for mainnet', async () => {
      expect(signedRequest.checkSignature(false)).to.be.undefined
    })
    it('rejects the same signature for testnet', async () => {
      expect(() => signedRequest.checkSignature(true)).to.throw('Invalid signature')
    })
  })

  describe('#toObject', () => {
    it('exports the signedRequest as an object', () => {
      const signedRequestObject = signedRequest.toObject()
      expect(signedRequestObject.encoded).to.equal(signedRequest.encoded)
      expect(signedRequestObject.initiator).to.equal(signedRequest.initiator)
      expect(signedRequestObject.signature).to.deep.equal(signedRequest.signature)
    })
  })
})

const signedSwapReleaseData = {
  encoded: '0x0000000000000000000000c800000d28000000000a00620b5b0e000101000101',
  initiator: '0x83bcd6a6a860eaac800a45bb1f4c30248e5dc619',
  recipient: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
  signature: [
    '0x171dd43bce19128b15f10c0aa4bddca8e4449a0c6bef5488e8208be4317f3bc9',
    '0x7f2f55df42529cf26aa5738b11debc57954f993aaa9693b2453a6923f6e6ce04',
    27
  ],
} as SignedSwapReleaseData

describe('SignedSwapRelease', () => {
  const signedRelease = new SignedSwapRelease(signedSwapReleaseData)
  
  describe('#constructor', () => {
    it('rejects if missing recipient', () => {
      const cloned = { ...signedSwapReleaseData, recipient: undefined }
      expect(() => new SignedSwapRelease(cloned)).to.throw('Missing recipient')
    })
    it('creates a SignedSwapRelease', async () => {
      const signedRelease = new SignedSwapRelease(signedSwapReleaseData)
      expect(signedRelease.encoded).to.equal(signedSwapReleaseData.encoded)
      expect(signedRelease.initiator).to.equal(signedSwapReleaseData.initiator.toLowerCase())
      expect(signedRelease.signature).to.equal(signedSwapReleaseData.signature)
      expect(signedRelease.recipient).to.equal(signedSwapReleaseData.recipient.toLowerCase())
    })
  })

  describe('#getDigest', () => {
    it('generates digest for testnet & mainnet', async () => {
      expect(signedRelease.getDigest(true)).to.equal('0x64a7ae116eb51bb689d153b09516d8bc0e1e31c07328f3ce36d35d69f12895c7')
      expect(signedRelease.getDigest(false)).to.equal('0xe23c3d0215db3cfb518cd355efcf9032491d4c83e94b5c5e76a74530c200a1a5')
    })
  })

  describe('#checkSignature', () => {
    it('validates the signature for mainnet', async () => {
      expect(signedRelease.checkSignature(false)).to.be.undefined
    })
    it('rejects the same signature for testnet', async () => {
      expect(() => signedRelease.checkSignature(true)).to.throw('Invalid signature')
    })
  })

  describe('#toObject', () => {
    it('exports the signedRelease as an object', () => {
      const signedReleaseObject = signedRelease.toObject()
      expect(signedReleaseObject.encoded).to.equal(signedRelease.encoded)
      expect(signedReleaseObject.initiator).to.equal(signedRelease.initiator)
      expect(signedReleaseObject.signature).to.deep.equal(signedRelease.signature)
      expect(signedReleaseObject.recipient).to.equal(signedRelease.recipient)
    })
  })
})