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
    it('creates a SignedSwapRequest', () => {
      const signedRequest = new SignedSwapRequest(signedSwapRequestData)
      expect(signedRequest.encoded).to.equal(signedSwapRequestData.encoded)
      expect(signedRequest.initiator).to.equal(signedSwapRequestData.initiator.toLowerCase())
      expect(signedRequest.signature).to.equal(signedSwapRequestData.signature)
    })
  })

  describe('#getDigest', () => {
    it('generates digest for testnet & mainnet', () => {
      const signedRequest2 = new SignedSwapRequest({ ...signedSwapRequestData, testnet: false })
      expect(signedRequest.getDigest()).to.equal(signedSwapRequestData.digest)
      expect(signedRequest2.getDigest()).to.equal(signedSwapRequestData.mainnetDigest)
    })
  })

  describe('#checkSignature', () => {
    it('validates the signature for testnet', () => {
      expect(signedRequest.checkSignature()).to.be.undefined
    })
    it('rejects the same signature for mainnet', () => {
      const signedRequest = new SignedSwapRequest({ ...signedSwapRequestData, testnet: false })
      expect(() => signedRequest.checkSignature()).to.throw('Invalid signature')
    })
    it('accepcts the mainnet signature for mainnet', () => {
      const cloned = { ...signedSwapRequestData, signature: signedSwapRequestData.mainnetSignature, testnet: false }
      const signedRequest = new SignedSwapRequest(cloned)
      expect(signedRequest.checkSignature()).to.be.undefined
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
    it('creates a SignedSwapRelease', () => {
      const signedRelease = new SignedSwapRelease(signedSwapReleaseData)
      expect(signedRelease.encoded).to.equal(signedSwapReleaseData.encoded)
      expect(signedRelease.initiator).to.equal(signedSwapReleaseData.initiator.toLowerCase())
      expect(signedRelease.signature).to.equal(signedSwapReleaseData.signature)
      expect(signedRelease.recipient).to.equal(signedSwapReleaseData.recipient)
    })
  })

  describe('#getDigest', () => {
    it('generates digest for testnet & mainnet', () => {
      expect(signedRelease.getDigest()).to.equal(signedSwapReleaseData.digest)
      const signedRelease2 = new SignedSwapRelease({ ...signedSwapReleaseData, testnet: false })
      expect(signedRelease2.getDigest()).to.equal(signedSwapReleaseData.mainnetDigest)
    })
  })

  describe('#checkSignature', () => {
    it('validates the signature for testnet', () => {
      expect(signedRelease.checkSignature()).to.be.undefined
    })
    it('rejects the same signature for mainnet', () => {
      const signedRelease = new SignedSwapRequest({ ...signedSwapRequestData, testnet: false })
      expect(() => signedRelease.checkSignature()).to.throw('Invalid signature')
    })
    it('accepcts the mainnet signature for mainnet', () => {
      const cloned = { ...signedSwapReleaseData, signature: signedSwapReleaseData.mainnetSignature, testnet: false }
      const signedRelease = new SignedSwapRelease(cloned)
      expect(signedRelease.checkSignature()).to.be.undefined
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