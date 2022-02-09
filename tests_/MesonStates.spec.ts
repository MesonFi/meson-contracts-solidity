import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('MesonStates', () => {

  describe('#checkRequestSignature', () => {
    it(' accepts validates a request signature', async () => {
        //expect check signature signer != address(0)
    })
    it('rejects  invalid a request signature', async () => {
        //expect check signature signer == address(0)
    })
  })

  describe('#checkReleaseSignature', () => {
    it('accepts validates a release signature', async () => {
        //expect check signer != address(0)
    })
    it('rejects signer cannot be empty address', async () => {
        //expect check signer == address(0)
    })
  })

})
