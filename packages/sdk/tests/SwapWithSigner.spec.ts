import { expect } from 'chai'
import { Wallet } from '@ethersproject/wallet'
import { getSwap } from './shared'
import { solidity, MockProvider } from 'ethereum-waffle';
import {
  SwapWithSigner,
  EthersWalletSwapSigner
} from '../src'
 

describe('SwapWithSigner', () => {
  let swapWithSigner: SwapWithSigner
  let initiator: Wallet
  let recipient: Wallet
  beforeEach('create SwapWithSigner', async () => {
    const wallets = new MockProvider().getWallets()
    initiator = wallets[1]
    recipient = wallets[3]
    const swapSigner = new EthersWalletSwapSigner(initiator)
    swapWithSigner = new SwapWithSigner(getSwap(), swapSigner)
  })
  
  describe('#signForRequest', () => {
    it('signs a swap request for testnet', async () => {
      expect( await (await swapWithSigner.signForRequest(true)).initiator).to.equal(initiator.address)  
    })
    it('signs a swap request for mainnet', async () => {
      expect( await (await swapWithSigner.signForRequest(false)).initiator).to.equal(initiator.address)  
    })
  })

  describe('#signForRelease', () => {
    it('signs a swap release for testnet', async () => {
      expect( (await swapWithSigner.signForRelease(recipient.address, true)).initiator).to.equal(initiator.address)
      expect( (await swapWithSigner.signForRelease(recipient.address, true)).recipient).to.equal(recipient.address)
    })
    it('signs a swap release for mainnet', async () => {
      expect( (await swapWithSigner.signForRelease(recipient.address, false)).initiator).to.equal(initiator.address)
      expect( (await swapWithSigner.signForRelease(recipient.address, false)).recipient).to.equal(recipient.address)
    })
  })
})
