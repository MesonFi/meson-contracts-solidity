import { waffle } from 'hardhat'
import { MesonClient } from '@meson/sdk'
import { MockToken, MesonPoolsTest } from '@meson/contract-typs'

import { expect } from './shared/expect'
import { wallet } from './shared/wallet'
import { fixtures } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('MesonPools', () => {
  let mesonInstance: MesonPoolsTest
  let token: MockToken
  let unsupportedToken: MockToken
  let outChain: string
  let mesonClient: MesonClient

  beforeEach('deploy MesonPoolsTest', async () => {
    const result = await waffle.loadFixture(() => fixtures(wallet))
    mesonInstance = result.pools
    token = result.token1
    unsupportedToken = result.token2

    outChain = await mesonInstance.getCurrentChain()
    mesonClient = await MesonClient.Create(mesonInstance)
  })

  describe('#token totalSupply & balance for signer', () => {
    it('is 1000000', async () => {
      expect(await token.totalSupply()).to.equal(1000000000)
      expect(await token.balanceOf(wallet.address)).to.equal(1000000000)
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
      expect(await mesonInstance.balanceOf(token.address, wallet.address)).to.equal(1000)
      expect(await mesonInstance.totalSupplyFor(token.address)).to.equal(1000)
      expect(await token.balanceOf(wallet.address)).to.equal(999999000)

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
      expect(await token.balanceOf(wallet.address)).to.equal(1000000000)

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

      const { r, s, v } = await mesonClient.signer.signSwapRequest(swap, wallet)
      await mesonInstance.lock(swap.encode(), token.address, swap.recipient, r, s, v)
      expect(await mesonInstance.balanceOf(token.address, wallet.address)).to.equal(0)
      expect(await mesonInstance.hasLockingSwap(swap.id())).to.equal(true)
    })

    it('refuses mismatch outToken or recipient', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ outToken: token.address }))
      await token.approve(mesonInstance.address, swap.amount)
      await mesonInstance.deposit(token.address, swap.amount)

      const { r, s, v } = await mesonClient.signer.signSwapRequest(swap, wallet)

      // await expect(
      //   contract.lock(swap.encode(), unsupportedToken.address, swap.recipient)
      // ).to.be.revertedWith('outToken does not match')

      await expect(
        mesonInstance.lock(swap.encode(), token.address, wallet.address, r, s, v)
      ).to.be.revertedWith('recipient does not match')
    })
  })

  describe('#release', async () => {
    it('accepts a release', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ outToken: token.address }))
      await token.approve(mesonInstance.address, swap.amount)
      await mesonInstance.deposit(token.address, swap.amount)

      const { r, s, v } = await mesonClient.signer.signSwapRequest(swap, wallet)
      await mesonInstance.lock(swap.encode(), token.address, swap.recipient, r, s, v)

      const { r: r2, s: s2, v: v2 } = await mesonClient.signer.signSwapRelease(swap.id(), wallet)
      await mesonInstance.release(swap.id(), swap.amount, r2, s2, v2)

      expect(await mesonInstance.balanceOf(token.address, wallet.address)).to.equal(0)
      expect(await token.balanceOf(swap.recipient)).to.equal(swap.amount)
    })
  })
})
