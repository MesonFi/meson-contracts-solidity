import { expect } from 'chai'
import { MockProvider } from 'ethereum-waffle';
import { pack } from '@ethersproject/solidity'
import { keccak256 } from '@ethersproject/keccak256'

import { SwapSigner, EthersWalletSwapSigner, RemoteSwapSigner } from '../src'
import { signedSwapRequestData, signedSwapReleaseData } from './shared'

describe('SwapSigner', () => {
  const swapSigner = new SwapSigner()
  const encoded = signedSwapReleaseData.encoded
  const recipient = signedSwapReleaseData.recipient

  describe('#getAddress', () => {
    it('rejects by "Not implemented"', () => {
      expect(() => swapSigner.getAddress()).to.throw('Not implemented')
    })
  })

  describe('#signSwapRequest', () => {
    it('rejects by "Not implemented"', async () => {
      await expect(swapSigner.signSwapRequest(encoded)).to.be.rejectedWith('Not implemented')
    })
  })

  describe('#signSwapRelease', () => {
    it('rejects by "Not implemented"', async () => {
      await expect(swapSigner.signSwapRelease(encoded, recipient)).to.be.rejectedWith('Not implemented')
    })
  })

  describe('#SwapSigner.hashRequest', () => {
    it('hashes a swap request for testnet', () => {
      expect(SwapSigner.hashRequest(encoded, true)).to.equal(signedSwapRequestData.digest)
    })

    it('hashes a swap request for mainnet', () => {
      expect(SwapSigner.hashRequest(encoded, false)).to.equal(signedSwapRequestData.mainnetDigest)
    })
  })

  describe('#SwapSigner.hashRelease', () => {
    it('hashes a swap release for testnet', () => {
      expect(SwapSigner.hashRelease(encoded, recipient, true)).to.equal(signedSwapReleaseData.digest)
    })

    it('hashes a swap release for mainnet', () => {
      expect(SwapSigner.hashRelease(encoded, recipient, false)).to.equal(signedSwapReleaseData.mainnetDigest)
    })
  })
})


describe('EthersWalletSwapSigner', () => {
  const initiator = new MockProvider().getWallets()[1]
  const swapSigner = new EthersWalletSwapSigner(initiator)
  const encoded = signedSwapReleaseData.encoded
  const recipient = signedSwapReleaseData.recipient

  beforeEach('create EthersWalletSwapSigner', async () => {
  })

  describe('#getAddress', () => {
    it('returns the signer address', async () => {
      expect(swapSigner.getAddress()).to.equal(initiator.address)
    })
  })

  describe('#signSwapRequest', () => {
    it('signs a swap request for testnet', async () => {
      expect(await swapSigner.signSwapRequest(encoded, true))
        .to.deep.equal(signedSwapRequestData.signature)
    })
    it('signs a swap request for mainnet', async () => {
      expect(await swapSigner.signSwapRequest(encoded, false))
        .to.deep.equal(signedSwapRequestData.mainnetSignature)
    })
  })

  describe('#signSwapRelease', () => {
    it('signs a swap release for testnet', async () => {
      expect(await swapSigner.signSwapRelease(encoded, recipient, true))
        .to.deep.equal(signedSwapReleaseData.signature)
    })
    it('signs a swap release for mainnet', async () => {
      expect(await swapSigner.signSwapRelease(encoded, recipient, false))
        .to.deep.equal(signedSwapReleaseData.mainnetSignature)
    })
  })
})


describe('RemoteSwapSigner', () => {
  const initiator = new MockProvider().getWallets()[1]
  const remoteSigner = {
    getAddress: () => initiator.address,
    signTypedData: async data => {
      const domainHash = keccak256(pack(
        data.map(() => 'string'),
        data.map(({ type, name }) => `${type} ${name}`)
      ))
      const types = data.map(({ type }) => type)
      const values = data.map(({ value }) => value)
      const digest = keccak256(pack(['bytes32', 'bytes32'], [domainHash, keccak256(pack(types, values))] ))
      const { r, s, v } = initiator._signingKey().signDigest(digest)
      return pack(['bytes32', 'bytes32', 'uint8'], [r, s, v])
    }
  }
  const swapSigner = new RemoteSwapSigner(remoteSigner)
  const encoded = signedSwapReleaseData.encoded
  const recipient = signedSwapReleaseData.recipient

  describe('#getAddress', () => {
    it('returns the signer address', async () => {
      expect(swapSigner.getAddress()).to.equal(initiator.address)
    })
  })

  describe('#signSwapRequest', () => {
    it('signs a swap request for testnet', async () => {
      expect(await swapSigner.signSwapRequest(encoded, true))
        .to.deep.equal(signedSwapRequestData.signature)
    })
    it('signs a swap request for mainnet', async () => {
      expect(await swapSigner.signSwapRequest(encoded, false))
        .to.deep.equal(signedSwapRequestData.mainnetSignature)
    })
  })

  describe('#signSwapRelease', () => {
    it('signs a swap release for testnet', async () => {
      expect(await swapSigner.signSwapRelease(encoded, recipient, true))
        .to.deep.equal(signedSwapReleaseData.signature)
    })
    it('signs a swap release for mainnet', async () => {
      expect(await swapSigner.signSwapRelease(encoded, recipient, false))
        .to.deep.equal(signedSwapReleaseData.mainnetSignature)
    })
  })
})
