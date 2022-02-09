import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('MesonClient', () => {

  describe('#Create', () => {
    it('accepts swapSigner null', async () => {
      //expect() check  swapSigner
    })
    it('set swapSigner', async () => {
      //expect() check swapSigner
    })
  })

  describe('#token', () => {
    it('rejects token index cannot be zero', async () => {
      //expect() check  index
    })
    it('accepts token ', async () => {
      //expect() check  index
    })
  })

  describe('#requestSwap', () => {
    it('rejects No swap signer assigned', async () => {
      //expect() check !this.#signer
    })
    it('accepts return SwapWithSigner', async () => {
      //expect() check  this.#signer
    })
  })

  describe('#depositAndRegister', () => {
    it('rejects token not supported', async () => {
      //expect() check !tokenIndex
    })
    it('accepts the depoit if all parameters are correct', async () => {
      // expect() check token balance of the provider
      // expect() check token balance of the meson contract
      // expect() check the pool balance of provider in meson contract
    })
  })

  describe('#deposit', () => {
    it('rejects token not supported', async () => {
      //expect() check !tokenIndex
    })
    it('rejects  call depositAndRegister first', async () => {
      //expect() check  !providerIndex
    })
    it('accepts the depoit if all parameters are correct', async () => {
      // expect() check token balance of the provider
      // expect() check token balance of the meson contract
      // expect() check the pool balance of provider in meson contract
    })
  })

  describe('#postSwap', () => {
    it('rejects address not registered', async () => {
      //expect() check !providerIndex
    })
    it('rejects  call depositAndRegister first.', async () => {
      //expect() check  !providerIndex
    })
    it('accepts the postSwap if all parameters are correct', async () => {
      // expect() check postSwap
    })
  })

})
