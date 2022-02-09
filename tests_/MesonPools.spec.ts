import { waffle } from 'hardhat'
import { MockToken, MesonPoolsTest } from '@mesonfi/contract-types'
import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE, TOKEN_TOTAL_SUPPLY } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'


describe('MesonPools', () => {
  
  describe('#depositAndRegister', () => {
    it('rejects negative amount', async () => {
      // expect() check  Amount must be positive
    })
    it('rejects zero amount', async () => {
      // expect() check  Amount must be positive
    })
    it('rejects if amount overflow', async () => {
      // expect() check  Amount must be positive
    })
    it('rejects the amount if no enough appove', async () => {
      // expect() check  amount must be appove
    })
    it('rejects if provider index is zero', async () => {
      // expect() check provider the  index
    })
    it('rejects if the address is already registered', async () => {
      // expect() check address  
    })
    it('rejects if the index is already registered', async () => {
      // expect() check  provider the Index
    })
    it('accepts the depoit if all parameters are correct', async () => {
      // expect() check token balance of the provider
      // expect() check token balance of the meson contract
      // expect() check the pool balance of provider in meson contract
    })
  })

  describe('#deposit', () => {
    it('rejects negative  amount', async () => {
      // expect() check  Amount must be positive
    })
    it('rejects zero amount ', async () => {
      // expect() check  Amount must be positive
    })
    it('rejects if amount overflow', async () => {
      // expect() check  Amount must be positive
    })
    it('rejects the amount if no enough appove', async () => {
      // expect() check  amount must be appove
    })
  })

  describe('#lock', async () => {
    it('rejects swap  already exists', async () => {
      // expect() check Swap 
    })
    it(' rejects caller not registered', async () => {
      // expect() check  provider the Index
    })
  })

  describe('#unlock', async () => {
    it('rejects swap  does not exist', async () => {
      //expect () check lockedSwap
    })
    it('rejects swap still in lock', async () => {
      //expect () check block.timestamp <
    })
    it('rejects swap still in lock', async () => {
      //expect () check block.timestamp ==
    })
  })

  describe('#release', async () => {
    it('rejects swap does not exist ', async () => {
      //expect () check lockedSwap 
    })
    it('refuses unsupported token', async () => {
      //expect () check  unsupported token 
    })
  })

  describe('#withdraw', () => {
    it('rejects Caller not registered', async () => {
      //expect() check  provider the Index
    })
    it('refuses unsupported token', async () => {
      //expect () check  unsupported token 
    })
  })
})
