import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { wallet } from './shared/wallet'
import { fixtures } from './shared/fixtures'
import { signSwap, Swap, getSwapId } from '../libs/meson_helpers'
import { MockToken } from '../typechain/MockToken'
import { MesonPoolsTest } from '../typechain/MesonPoolsTest'

describe('MesonPools', () => {
  let contract: MesonPoolsTest
  let token: MockToken
  let unsupportedToken: MockToken

  beforeEach('deploy MesonPoolsTest', async () => {
    const result = await waffle.loadFixture(() => fixtures(wallet))
    contract = result.pools
    token = result.token1
    unsupportedToken = result.token2
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
      await contract.withdraw(token.address, 1000, 0)
      expect(await contract.totalSupplyFor(token.address)).to.equal(0)
      expect(await token.balanceOf(wallet.address)).to.equal(1000000000)

      await expect(contract.withdraw(token.address, 1, 0)).to.be.revertedWith('overdrawn')
    })

    it('refuses unsupported token', async () => {
      await expect(contract.withdraw(unsupportedToken.address, 1000, 0)).to.be.revertedWith('unsupported token')
    })

    it('refuses too much withdrawal in one epoch', async () => {
      await token.approve(contract.address, 200000000)
      await contract.deposit(token.address, 200000000)
      await expect(contract.withdraw(token.address, 100000001, 0)).to.be.revertedWith('overdrawn in epoch')
    })

    it('refuses wrong epoch', async () => {
      await token.approve(contract.address, 1000)
      await contract.deposit(token.address, 1000)
      await expect(contract.withdraw(token.address, 1000, 1)).to.be.revertedWith('wrong epoch')
    })
  })


  describe('#release', async () => {
    const inToken = ethers.utils.toUtf8Bytes('IN_TOKEN_ADDR')
    const receiver = '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211'
    const amount = 100
    const epoch = 0
    const ts = Date.now()

    it('accepts 100 release', async () => {
      const outChain = await contract.getCurrentChain()
      
      await token.approve(contract.address, 1000)
      await contract.deposit(token.address, 1000)

      const swap: Swap = {
        inToken,
        outToken: token.address,
        outChain,
        receiver,
        amount,
        ts,
      }

      const swapId = getSwapId(swap)
      const signature = signSwap(wallet, swapId, epoch)

      const receiverInitialBalance = BigInt(await token.balanceOf(receiver))
      await contract.release(wallet.address, signature, amount, inToken, token.address, receiver, ts, epoch)
      const receiverFinalBalance = (receiverInitialBalance + BigInt(amount)).toString()

      expect(await contract.balanceOf(token.address, wallet.address)).to.equal(1000 - amount)
      expect(await token.balanceOf(receiver)).to.equal(receiverFinalBalance)
    })

    it('refuses unsupported token', async () => {
      await expect(contract.release(wallet.address, '0x', amount, inToken, unsupportedToken.address, receiver, ts, epoch))
        .to.be.revertedWith('unsupported token')
    })

    it('refuses wrong epoch', async () => {
      await expect(contract.release(wallet.address, '0x', amount, inToken, token.address, receiver, ts, epoch + 2))
        .to.be.revertedWith('invalid epoch')
    })
  })
})
