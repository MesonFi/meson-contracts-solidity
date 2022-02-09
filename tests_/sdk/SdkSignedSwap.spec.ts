import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('SignedSwap', () => {

  describe('#checkSignature', () => {
    it('rejects Invalid signature', async () => {
      //expect() check  recovered !== this.initiator
    })
    it('accepts  retrun signature', async () => {
      //expect() check signature
    })
  })

})
