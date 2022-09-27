import { expect } from 'chai'
import { MockProvider } from 'ethereum-waffle'
import { Wallet } from 'ethers'

import { SwapWithSigner, EthersWalletSwapSigner } from '../src'
import { signedSwapRequestData, signedSwapReleaseData } from './shared'

describe('SwapWithSigner', () => {
  let swapWithSigner: SwapWithSigner
  let initiator: Wallet

  beforeEach('create SwapWithSigner', () => {
    const wallets = new MockProvider().getWallets()
    initiator = wallets[1]
    const swapSigner = new EthersWalletSwapSigner(initiator)
    const swap = SwapWithSigner.decode(signedSwapRequestData.encoded)
    swapWithSigner = new SwapWithSigner(swap, swapSigner)
  })

  describe('#signForRequest', () => {
    it('signs a swap request for testnet', async () => {
      const signedSwapRequest = await swapWithSigner.signForRequest(true)
      expect(signedSwapRequest.initiator).to.equal(initiator.address)
      expect(signedSwapRequest.signature).to.deep.equal(signedSwapRequestData.signature)
    })
    it('signs a swap request for mainnet', async () => {
      const signedSwapRequest = await swapWithSigner.signForRequest(false)
      expect(signedSwapRequest.initiator).to.equal(initiator.address)
      expect(signedSwapRequest.signature).to.deep.equal(signedSwapRequestData.mainnetSignature)
    })
  })

  describe('#signForRelease', () => {
    it('signs a swap release for testnet', async () => {
      const signedSwapRelease = await swapWithSigner.signForRelease(signedSwapReleaseData.recipient, true)
      expect(signedSwapRelease.initiator).to.equal(initiator.address)
      expect(signedSwapRelease.recipient).to.equal(signedSwapReleaseData.recipient)
      expect(signedSwapRelease.signature).to.deep.equal(signedSwapReleaseData.signature)
    })
    it('signs a swap release for mainnet', async () => {
      const signedSwapRelease = await swapWithSigner.signForRelease(signedSwapReleaseData.recipient, false)
      expect(signedSwapRelease.initiator).to.equal(initiator.address)
      expect(signedSwapRelease.recipient).to.equal(signedSwapReleaseData.recipient)
      expect(signedSwapRelease.signature).to.deep.equal(signedSwapReleaseData.mainnetSignature)
    })
  })
})
