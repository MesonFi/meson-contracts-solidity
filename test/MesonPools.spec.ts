import { waffle } from 'hardhat'
import { MesonClient } from '@meson/sdk'
import { MockToken, MesonPoolsTest } from '@meson/contract-typs'

import { expect } from './shared/expect'
import { wallet } from './shared/wallet'
import { fixtures } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('MesonPools', () => {
  let contract: MesonPoolsTest
  let token: MockToken
  let unsupportedToken: MockToken
  let outChain: string
  let meson: MesonClient

  beforeEach('deploy MesonPoolsTest', async () => {
    const result = await waffle.loadFixture(() => fixtures(wallet))
    contract = result.pools
    token = result.token1
    unsupportedToken = result.token2

    outChain = await contract.getCurrentChain()
    meson = new MesonClient({ mesonAddress: contract.address, chainId: '0x3' })
  })

  describe('#token totalSupply & balance for signer', () => {
    it('is 1000000', async () => {
      expect(await token.totalSupply()).to.equal(1000000000)
      expect(await token.balanceOf(wallet.address)).to.equal(1000000000)
    })
  })

  describe('#totalSupplyFor', () => {
    it('is zero', async () => {
      expect(await contract.totalSupplyFor(token.address)).to.equal(0)
    })
  })

  describe('#deposit', () => {
    it('accepts 1000 deposit', async () => {
      await token.approve(contract.address, 1000)
      await contract.deposit(token.address, 1000)
      expect(await contract.balanceOf(token.address, wallet.address)).to.equal(1000)
      expect(await contract.totalSupplyFor(token.address)).to.equal(1000)
      expect(await token.balanceOf(wallet.address)).to.equal(999999000)

      await expect(contract.deposit(token.address, 1)).to.be.reverted
    })

    it('refuses unsupported token', async () => {
      await unsupportedToken.approve(contract.address, 1000)
      await expect(contract.deposit(unsupportedToken.address, 1000)).to.be.revertedWith('unsupported token')

      await expect(contract.deposit(token.address, 1)).to.be.reverted
    })
  })

  describe('#withdraw', () => {
    it('accepts 1000 deposit and 1000 withdrawal', async () => {
      await token.approve(contract.address, 1000)
      await contract.deposit(token.address, 1000)
      await contract.withdraw(token.address, 1000)
      expect(await contract.totalSupplyFor(token.address)).to.equal(0)
      expect(await token.balanceOf(wallet.address)).to.equal(1000000000)

      await expect(contract.withdraw(token.address, 1)).to.be.revertedWith('overdrawn')
    })

    it('refuses unsupported token', async () => {
      await expect(contract.withdraw(unsupportedToken.address, 1000)).to.be.revertedWith('unsupported token')
    })
  })

  describe('#lock', async () => {
    it('lockes a swap', async () => {
      const swap = meson.requestSwap(outChain, getDefaultSwap({ outToken: token.address }))
      await token.approve(contract.address, swap.amount)
      await contract.deposit(token.address, swap.amount)

      await contract.lock(swap.encode(), token.address, swap.recipient)
      expect(await contract.balanceOf(token.address, wallet.address)).to.equal(0)
      expect(await contract.isSwapLocked(swap.id())).to.equal(true)
    })

    it('refuses mismatch outToken or recipient', async () => {
      const swap = meson.requestSwap(outChain, getDefaultSwap({ outToken: token.address }))
      await token.approve(contract.address, swap.amount)
      await contract.deposit(token.address, swap.amount)

      // await expect(
      //   contract.lock(swap.encode(), unsupportedToken.address, swap.recipient)
      // ).to.be.revertedWith('outToken does not match')

      await expect(
        contract.lock(swap.encode(), token.address, wallet.address)
      ).to.be.revertedWith('recipient does not match')
    })
  })

  describe('#release', async () => {
    it('accepts a release', async () => {
      const swap = meson.requestSwap(outChain, getDefaultSwap({ outToken: token.address }))
      await token.approve(contract.address, swap.amount)
      await contract.deposit(token.address, swap.amount)

      await contract.lock(swap.encode(), token.address, swap.recipient)
      const { r, s, v } = await meson.signer.signSwapRelease(swap.id(), wallet)
      await contract.release(swap.id(), swap.amount, r, s, v)

      expect(await contract.balanceOf(token.address, wallet.address)).to.equal(0)
      expect(await token.balanceOf(swap.recipient)).to.equal(swap.amount)
    })
  })
})
