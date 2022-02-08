import { waffle } from 'hardhat'
import {
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} from '@mesonfi/sdk'
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
    const result = await waffle.loadFixture(() => fixtures([
      initiator.address, provider.address
    ]))
    token = result.token1.connect(provider)
    mesonInstance = result.pools.connect(provider) // provider is signer

    userClient = await MesonClient.Create(result.pools, new EthersWalletSwapSigner(initiator))
    lpClient = await MesonClient.Create(mesonInstance)
    outChain = lpClient.shortCoinType
    await token.approve(mesonInstance.address, 1000)
  })

  describe('#token total supply', () => {
    it(`is ${TOKEN_TOTAL_SUPPLY}`, async () => {
      expect(await token.totalSupply()).to.equal(TOKEN_TOTAL_SUPPLY)
    })
  })

  describe('#token balance for an account', () => {
    it(`is ${TOKEN_BALANCE}`, async () => {
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE)
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE)
    })
  })

  describe('#token balance', () => {
    it('is zero', async () => {
      expect(await token.balanceOf(mesonInstance.address)).to.equal(0)
    })
  })

  describe('#depositAndRegister', () => {
    it('accepts 1000 deposit', async () => {
      await lpClient.depositAndRegister(lpClient.token(1), '1000', '1')
      expect(await mesonInstance.balanceOf(lpClient.token(1), provider.address)).to.equal(1000)
      expect(await token.balanceOf(mesonInstance.address)).to.equal(1000)
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE.sub(1000))

      await expect(mesonInstance.deposit(lpClient.token(1), 1)).to.be.reverted
    })

    it('refuses unsupported token', async () => {
      await expect(lpClient._depositAndRegister('1000', 2, '1')).to.be.reverted
    })
  })

  describe('#withdraw', () => {
    it('accepts 1000 deposit and 1000 withdrawal', async () => {
      await lpClient.depositAndRegister(lpClient.token(1), '1000', '1')
      await mesonInstance.withdraw('1000', 1)
      expect(await token.balanceOf(mesonInstance.address)).to.equal(0)
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE)

      await expect(mesonInstance.withdraw('1', 1)).to.be.revertedWith('underflow')
    })

    it('refuses unsupported token', async () => {
      await expect(mesonInstance.withdraw('1000', 2)).to.be.reverted
    })
  })

  describe('#lock', async () => {
    it('lockes a swap', async () => {
      await lpClient.depositAndRegister(lpClient.token(1), '1000', '1')

      const swap = userClient.requestSwap(getDefaultSwap(), outChain)
      const request = await swap.signForRequest()

      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      await lpClient.lock(signedRequest)

      expect(await mesonInstance.balanceOf(lpClient.token(1), initiator.address)).to.equal(0)
      // expect(await mesonInstance.getLockedSwap(swap.encoded)).to.equal(true)
    })
  })

  describe('#release', async () => {
    it('accepts a release', async () => {
      await lpClient.depositAndRegister(lpClient.token(1), '1000', '1')

      const swapData = getDefaultSwap()
      const swap = userClient.requestSwap(swapData, outChain)
      const request = await swap.signForRequest()
      
      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      await lpClient.lock(signedRequest)

      const release = await swap.signForRelease(swapData.recipient)
      const signedRelease = new SignedSwapRelease(release)
      signedRelease.checkSignature()
      await lpClient.release(signedRelease)

      expect(await mesonInstance.balanceOf(lpClient.token(1), initiator.address)).to.equal(0)
      expect(await token.balanceOf(swapData.recipient)).to.equal(swap.amount)
    })
  })
})
