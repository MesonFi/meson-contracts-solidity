import { expect } from 'chai'

import { SignedSwapRequest, SignedSwapRelease } from '../src'
import { signedSwapRequestData, signedSwapReleaseData } from './shared'

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