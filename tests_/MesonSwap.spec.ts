import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('MesonSwap', () => {

  describe('#postSwap', () => {
    it('rejects Swap already exists', async () => {
      //expect  check postedSwaps[encodedSwap] != 0
    })
    it('rejects expire ts too early', async () => {
      //expect  check   delta < MIN_BOND_TIME_PERIOD
    })
    it('accepts postSwap', async () => {
      //expect check delta < MAX_BOND_TIME_PERIOD
    })
    it('rejects expire ts too late ', async () => {
      //expect check delta = MAX_BOND_TIME_PERIOD
    })
    it('rejects  expire ts too late ', async () => {
      //expect check delta < MAX_BOND_TIME_PERIOD
    })
    it('refuses unsupported token', async () => {
      //expect check token
    })
  })

  describe('#executeSwap', () => {
    it('accepts executeSwap', async () => {
      //expect check  postedSwap != 0
    })
    it('rejects swap does not exist', async () => {
      //expect check  postedSwap == 0
    })
  })

  describe('#bondSwap', () => {
    it('accepts  bondSwap', async () => {
      //expect check postedSwap != 0
    })
    it('rejects swap does not exist ', async () => {
      //expect check postedSwap == 0
    })
  })

  describe('#cancelSwap', () => {
    it('accepts postedSwap', async () => {
      //expect check  postedSwap > 1
    })
    it('rejects Swap does not exist ', async () => {
      //expect check postedSwap < 1
    })
  })
})
