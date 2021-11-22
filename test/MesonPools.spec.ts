import { waffle } from 'hardhat'
import { expect } from './shared/expect'
import { wallet } from './shared/wallet'
import { fixtures } from './shared/fixtures'
import { MockToken } from '../typechain/MockToken'
import { MesonPoolsTest } from '../typechain/MesonPoolsTest'

describe('MesonPools', () => {
  let contract: MesonPoolsTest
  let token: MockToken
  let unsupportedToken: MockToken

  beforeEach('deploy MesonPoolsTest', async () => {
    const result = await waffle.loadFixture(fixtures)
    contract = result.contract
    token = result.token1
    unsupportedToken = result.token2
  })

  describe('#totalSupplyFor', () => {
    it('is zero', async () => {
      expect(await contract.totalSupplyFor(token.address)).to.equal(0)
    })
  })

  describe('#totalSupply', () => {
    it('is 1000000', async () => {
      expect(await token.totalSupply()).to.equal(1000000000)
      expect(await token.balanceOf(wallet.address)).to.equal(1000000000)
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
      await contract.withdraw(token.address, 1000, 0)
      expect(await contract.totalSupplyFor(token.address)).to.equal(0)
      expect(await token.balanceOf(wallet.address)).to.equal(1000000000)

      await expect(contract.withdraw(token.address, 1, 0)).to.be.revertedWith('overdrawn')
    })

    it('refuses too much withdrawal in one epoch', async () => {
      await token.approve(contract.address, 2000000)
      await contract.deposit(token.address, 2000000)
      await expect(contract.withdraw(token.address, 1000001, 0)).to.be.revertedWith('overdrawn in epoch')
    })

    it('refuses wrong epoch', async () => {
      await token.approve(contract.address, 1000)
      await contract.deposit(token.address, 1000)
      await expect(contract.withdraw(token.address, 1000, 1)).to.be.revertedWith('wrong epoch')
    })
  })
})
