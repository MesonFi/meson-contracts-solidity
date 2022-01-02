import { waffle } from 'hardhat'
import { MesonClient } from '@meson/sdk'
import { MockToken, MesonPoolsTest } from '@meson/contract-typs'

import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE, TOKEN_TOTAL_SUPPLY } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('MesonPools', () => {
  let mesonInstance: MesonPoolsTest
  let token: MockToken
  let unsupportedToken: MockToken
  let outChain: string
  let mesonClient: MesonClient

  beforeEach('deploy MesonPoolsTest', async () => {
    const result = await waffle.loadFixture(() => fixtures([
      initiator.address, provider.address
    ]))
    mesonInstance = result.pools.connect(provider)
    token = result.token1.connect(provider)
    unsupportedToken = result.token2.connect(provider)

    outChain = await mesonInstance.getCoinType()
    mesonClient = await MesonClient.Create(mesonInstance)
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

  describe('#totalSupplyFor', () => {
    it('is zero', async () => {
      expect(await mesonInstance.totalSupplyFor(token.address)).to.equal(0)
    })
  })

  describe('#deposit', () => {
    it('accepts 1000 deposit', async () => {
      await token.approve(mesonInstance.address, 1000)
      await mesonInstance.deposit(token.address, 1000)
      expect(await mesonInstance.balanceOf(token.address, provider.address)).to.equal(1000)
      expect(await mesonInstance.totalSupplyFor(token.address)).to.equal(1000)
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE.sub(1000))

      await expect(mesonInstance.deposit(token.address, 1)).to.be.reverted
    })

    it('refuses unsupported token', async () => {
      await unsupportedToken.approve(mesonInstance.address, 1000)
      await expect(mesonInstance.deposit(unsupportedToken.address, 1000)).to.be.revertedWith('unsupported token')

      await expect(mesonInstance.deposit(token.address, 1)).to.be.reverted
    })
  })

  describe('#withdraw', () => {
    it('accepts 1000 deposit and 1000 withdrawal', async () => {
      await token.approve(mesonInstance.address, 1000)
      await mesonInstance.deposit(token.address, 1000)
      await mesonInstance.withdraw(token.address, 1000)
      expect(await mesonInstance.totalSupplyFor(token.address)).to.equal(0)
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE)

      await expect(mesonInstance.withdraw(token.address, 1)).to.be.revertedWith('overdrawn')
    })

    it('refuses unsupported token', async () => {
      await expect(mesonInstance.withdraw(unsupportedToken.address, 1000)).to.be.revertedWith('unsupported token')
    })
  })

  describe('#lock', async () => {
    it('lockes a swap', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ outToken: token.address }))
      await token.approve(mesonInstance.address, swap.amount)
      await mesonInstance.deposit(token.address, swap.amount)

      const sigs = await swap.signRequest(initiator)
      await mesonInstance.lock(swap.encode(), token.address, swap.recipient, ...sigs)

      expect(await mesonInstance.balanceOf(token.address, initiator.address)).to.equal(0)
      expect(await mesonInstance.hasLockingSwap(swap.swapId)).to.equal(true)
    })

    it('refuses mismatch outToken or recipient', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ outToken: token.address }))
      await token.approve(mesonInstance.address, swap.amount)
      await mesonInstance.deposit(token.address, swap.amount)

      const sigs = await swap.signRequest(initiator)

      // await expect(
      //   contract.lock(swap.encode(), unsupportedToken.address, swap.recipient)
      // ).to.be.revertedWith('outToken does not match')

      await expect(
        mesonInstance.lock(swap.encode(), token.address, provider.address, ...sigs)
      ).to.be.revertedWith('recipient does not match')
    })
  })

  describe('#release', async () => {
    it('accepts a release', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ outToken: token.address }))
      await token.approve(mesonInstance.address, swap.amount)
      await mesonInstance.deposit(token.address, swap.amount)

      const sigs = await swap.signRequest(initiator)
      await mesonInstance.lock(swap.encode(), token.address, swap.recipient, ...sigs)

      const releaseSig = await swap.signRelease(initiator)
      await mesonInstance.release(swap.swapId, swap.amount, ...releaseSig)

      expect(await mesonInstance.balanceOf(token.address, initiator.address)).to.equal(0)
      expect(await token.balanceOf(swap.recipient)).to.equal(swap.amount)
    })
  })
})
