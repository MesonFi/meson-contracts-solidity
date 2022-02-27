import { expect } from 'chai'

import {
  MesonClient,
  SignedSwapRequest,
  SignedSwapRelease,
} from '../src'
import { getDefaultSwap } from './shared'

describe('SignedSwapRequest', () => {
  let outChain: string
  let userClient: MesonClient
  
  describe('#constructor', () => {
    it('rejects missing encoded', async () => {
      try {
        const signedRequest = new SignedSwapRequest({
          encoded: '',
          initiator: '0x83bcD6A6a860EAac800A45BB1f4c30248e5Dc619',
          signature: [
            '0xc08846c00968ffbc5f8ed98432d043ac9a786816ee9b50daffa493b6560b1bf0',
            '0x712a685a28b53faa636237b215f40b125ec6e33bd590894dc38203c3a75b2bed',
            28
          ],
        })
      } catch (error) {
        expect(error).to.match(/Missing encoded/)
      }
    })
    it('rejects missing initiator', async () => {
      try {
        const signedRequest = new SignedSwapRequest({
          encoded: '0x000000000000000000000064000003c1000000000a00620a4c3e000101000101',
          initiator: '',
          signature: [
            '0xc08846c00968ffbc5f8ed98432d043ac9a786816ee9b50daffa493b6560b1bf0',
            '0x712a685a28b53faa636237b215f40b125ec6e33bd590894dc38203c3a75b2bed',
            28
          ],
        })
      } catch (error) {
        expect(error).to.match(/Missing initiator/)
      }
    })
    it('rejects  missing signature', async () => {
      try {
        const signedRequest = new SignedSwapRequest({
          encoded: '0x000000000000000000000064000003c1000000000a00620a4c3e000101000101',
          initiator: '0x83bcD6A6a860EAac800A45BB1f4c30248e5Dc619',
          signature: null,
        })
      } catch (error) {
        expect(error).to.match(/Missing signature/)
      }
      // const signedRequest = new SignedSwapRequest({
      //   encoded: '0x000000000000000000000064000003c1000000000a00620a4c3e000101000101',
      //   initiator: '0x83bcD6A6a860EAac800A45BB1f4c30248e5Dc619',
      //   signature: [
      //     '',
      //     '',
      //     0
      //   ],
      // })
    })
    it('accepts signedSwapRequest', async () => {
      const swap = userClient.requestSwap(getDefaultSwap(), outChain)
      const request = await swap.signForRequest()
      const signedRequest = new SignedSwapRequest(request)
      expect(signedRequest.encoded).to.equal(request.encoded)
      expect(signedRequest.initiator).to.equal(request.initiator.toLowerCase())
      expect(signedRequest.signature).to.equal(request.signature)
    })
  })

  describe('#getDigest', () => {
  })

  describe('#checkSignature', () => {
  })

  describe('#toObject', () => {
  })
})

describe('SignedSwapRelease', () => {
  let outChain: string
  let userClient: MesonClient
  
  describe('#constructor', () => {
    it('rejects missing recipient', async () => {
      try {
        const signedRelease = new SignedSwapRelease({
          encoded: '0x0000000000000000000000c800000d28000000000a00620b5b0e000101000101',
          initiator: '0x83bcd6a6a860eaac800a45bb1f4c30248e5dc619',
          recipient: '',
          signature: [
            '0x171dd43bce19128b15f10c0aa4bddca8e4449a0c6bef5488e8208be4317f3bc9',
            '0x7f2f55df42529cf26aa5738b11debc57954f993aaa9693b2453a6923f6e6ce04',
            27
          ],
        })
      } catch (error) {
        expect(error).to.match(/Missing recipient/)
      }
    })
    it('accepts signedSwapRequest', async () => {
      const swapData = getDefaultSwap({ inToken: 1, outToken: 1 })
      const swap = userClient.requestSwap(swapData, outChain)
      const release = await swap.signForRelease(swapData.recipient)
      const signedRelease = new SignedSwapRelease(release)
      expect(signedRelease.encoded).to.equal(release.encoded)
      expect(signedRelease.initiator).to.equal(release.initiator.toLowerCase())
      expect(signedRelease.signature).to.equal(release.signature)
    })
  })

  describe('#getDigest', () => {
  })

  describe('#checkSignature', () => {
  })

  describe('#toObject', () => {
  })
})