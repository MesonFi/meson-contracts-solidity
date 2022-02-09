import { waffle } from 'hardhat'
import { MockToken, MesonPoolsTest } from '@mesonfi/contract-types'
import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE, TOKEN_TOTAL_SUPPLY } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'


describe('MesonPools', () => {
  describe('#depositAndRegister', () => {
    it('rejects negative amount', async () => {
      // Amount must be positive
    })
    it('rejects zero amount', async () => {
      //Amount must be positive
    })
    it('rejects if amount overflow', async () => {
      //Amount must be positive
    })
    it('rejects the amount if no enough appove', async () => {
      //true
    })
    it('rejects if provider index is zero', async () => {
      //Cannot use 0 as provider index
    })
    it('rejects if the address is already registered', async () => {
      //true
    })
    it('rejects if the index is already registered', async () => {
      //Address already registered
      // expect() error from xxxx
    })
    it('accepts the depoit if all parameters are correct', async () => {
      //true
      // expect() check token balance of the provider
      // expect() check token balance of the meson contract
      // expect() check the pool balance of provider in meson contract
    })
  })

  describe('#deposit', () => {
    it('amount <= 0 ', async () => {
      //Amount must be positive
    })
    it('amount  == 0 ', async () => {
      //Amount must be positive
    })

    it('amount > 0', async () => {
      //true
    })
    it('Finally, check the results', async () => {
      //true
    })
  })

  describe('#lock', async () => {
    it('_lockedSwaps[encodedSwap] == 0', async () => {
      //true
    })
    it('_lockedSwaps[encodedSwap] != 0', async () => {
      //Swap already exists
    })
    it('providerIndex != 0', async () => {
      //true
    })
    it('providerIndex == 0', async () => {
      //Caller not registered. Call depositAndRegister.
    })
    it('Finally, check the results', async () => {
      //true
    })
  })


  describe('#unlock', async () => {
    it('lockedSwap != 0 ', async () => {
      //true
    })
    it('lockedSwap == 0 ', async () => {
      //Swap does not exist
    })

    it('uint240(block.timestamp << 200) > lockedSwap ', async () => {
      //true
    })
    it('uint240(block.timestamp << 200) = lockedSwap ', async () => {
      //Swap still in lock
    })
    it('uint240(block.timestamp << 200) < lockedSwap ', async () => {
      //Swap still in lock
    })
    it('Finally, check the results', async () => {
      //true
    })
  })

  describe('#release', async () => {
    it('lockedSwap != 0 ', async () => {
      //true
    })
    it('lockedSwap == 0 ', async () => {
      //Swap does not exist
    })
    it('lockedSwap < 0 ', async () => {
      //Swap does not exist
    })
    it('refuses unsupported token', async () => {
      //false
    })
  })


  describe('#withdraw', () => {
    it('providerIndex != 0   ', async () => {
      //true
    })
    it('providerIndex == 0   ', async () => {
      //Caller not registered. Call depositAndRegister
    })
    it('refuses unsupported token', async () => {
      //false
    })
  })
})
