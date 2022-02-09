import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('Swap', () => {

  describe('#decode', () => {
    it('rejects encoded swap should be a hex string of length 66', async () => {
      //expect() check !encoded.startsWith('0x') || encoded.length !== 66
    })
    it('accepts  retrun Swap', async () => {
      //expect() check Swap
    })
  })

})
