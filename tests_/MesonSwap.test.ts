import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('MesonSwap', () => {

  describe('#postSwap', () => {
    it('postedSwaps[encodedSwap] == 0', async () => {
      //true
    })
    it('_postedSwaps[encodedSwap] != 0', async () => {
      //Swap already exists
    })
    it('delta > MIN_BOND_TIME_PERIOD', async () => {
      //true
    })
    it('delta < MIN_BOND_TIME_PERIOD', async () => {
      //Expire ts too early 
    })
    it('delta =MIN_BOND_TIME_PERIOD', async () => {
      //Expire ts too early 
    })
    it('delta < MAX_BOND_TIME_PERIOD', async () => {
      //true
    })
    it('delta = MAX_BOND_TIME_PERIOD', async () => {
      //Expire ts too late 
    })
    it('delta < MAX_BOND_TIME_PERIOD', async () => {
      //Expire ts too late 
    })
    it('refuses unsupported token', async () => {
      //false
    })
  })

  describe('#executeSwap', () => {
    it('postedSwap != 0', async () => {
      //true
    })
    it('postedSwap == 0', async () => {
      //Swap does not exist
    })
  })

  describe('#bondSwap', () => {
    it('postedSwap != 0', async () => {
      //true
    })
    it('postedSwap == 0', async () => {
      //Swap does not exist
    })
    it('postedSwap == 0', async () => {
      //true
    })
    it('postedSwap!= 0', async () => {
      //SSwap bonded to another provider
    })
  })

  describe('#cancelSwap', () => {
    it('postedSwap > 1', async () => {
      //true
    })
    it('postedSwap < 1', async () => {
      //Swap does not exist
    })
    it('(encodedSwap >> 48) & 0xFFFFFFFFFF) < block.timestamp', async () => {
      //true
    })
    it('(encodedSwap >> 48) & 0xFFFFFFFFFF) < block.timestamp', async () => {
      //Swap is still locked
    })
  })


})
