import { waffle } from 'hardhat'
import {
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} from '@mesonfi/sdk/src'
import { MockToken, MesonPoolsTest } from '@mesonfi/contract-types'
import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE, TOKEN_TOTAL_SUPPLY } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'


describe('MesonPools', () => {
  let token: MockToken
  let mesonInstance: MesonPoolsTest
  let outChain: string
  let userClient: MesonClient
  let lpClient: MesonClient

  beforeEach('deploy MesonPoolsTest', async () => {

  })

  describe('#depositAndRegister', () => {
    it('accepts the depoit if all parameters are correct', async () => {

    })
    it('rejects negative amount', async () => {

    })
    it('rejects zero amount', async () => {

    })
    it('rejects if amount overflow', async () => {

    })
    it('rejects the amount if no enough appove', async () => {

    })
    it('rejects Index already registered', async () => {

    })
    it('rejects if provider index is zero', async () => {

    })
    it('rejects if the address is already registered', async () => {

    })
    it('rejects if the index is already registered', async () => {

    })
    it('refuses unsupported token', async () => {

    })
  })

  describe('#deposit', () => {
    it('rejects negative  amount', async () => {

    })
    it('rejects zero amount ', async () => {

    })
    it('rejects if amount overflow', async () => {

    })
    it('rejects the amount if no enough appove', async () => {

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