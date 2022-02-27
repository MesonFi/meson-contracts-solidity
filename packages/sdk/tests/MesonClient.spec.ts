import { expect } from 'chai'

import { Contract } from '@ethersproject/contracts'
import { AddressZero } from '@ethersproject/constants'
import { Meson } from '@mesonfi/contract-types'
import { Meson as MesonAbi } from '@mesonfi/contract-abis'

import {
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} from '../src'

import { getDefaultSwap } from './shared'

describe('MesonClient', () => {
  let mesonInstance: Meson
  let mesonClient: MesonClient

  beforeEach('deploy MesonPoolsTest', async () => {
    mesonInstance = new Contract(AddressZero, MesonAbi.abi) as Meson
    mesonClient = new MesonClient(mesonInstance, '0')
  })

  describe('#MesonClient.Create', () => {
    it('returns an MesonClient instance with shortCoinType', () => {
      // expect(mesonClient.shortCoinType).to.equal()
    })
  })

  describe('#token', () => {
    it('rejects 0 or undefined index', () => {
      expect(() => mesonClient.token()).to.throw('Token index cannot be zero')
      expect(() => mesonClient.token(0)).to.throw('Token index cannot be zero')
    })
    it('returns token for an in-range index', () => {
      
    })
    it('returns undefined for out-of-range index', () => {

    })
  })

  describe('#requestSwap', () => {
    it('rejects if swap signer is not set', () => {

    })
    it('returns a SwapWithSigner if swap signer is set', () => {
      
    })
  })

  describe('#depositAndRegister', () => {
    it('rejects negative amount', async () => {
    })
  })

  describe('#deposit', () => {
    it('rejects negative  amount', async () => {
    })
  })

  describe('#postSwap', () => {
    it('rejects negative  amount', async () => {
    })
  })

  describe('#lock', async () => {
    it('rejects swap  already exists', async () => {
    })
  })

  describe('#unlock', async () => {
    it('rejects swap  already exists', async () => {
    })
  })

  describe('#release', async () => {
    it('rejects swap does not exist', async () => {
    })
  })

  describe('#executeSwap', () => {
    it('rejects Caller not registered', async () => {
    })
  })

  describe('#cancelSwap', () => {
    it('rejects Caller not registered', async () => {
    })
  })

  describe('#getPostedSwap', () => {
    it('rejects Caller not registered', async () => {
    })
  })

  describe('#getLockedSwap', () => {
    it('rejects Caller not registered', async () => {
    })
  })
})
