import { waffle, ethers } from 'hardhat'
import { expect } from './shared/expect'
import { wallet } from './shared/wallet'
import { fixtures } from './shared/fixtures'
import { getSwapId, signSwap, Swap } from '../libs/meson_helpers'
import { MockToken } from '../typechain/MockToken'
import { MesonSwapTest } from '../typechain/MesonSwapTest'

describe('MesonSwap', () => {
  let contract: MesonSwapTest
  let token: MockToken
  let unsupportedToken: MockToken

  beforeEach('deploy MesonSwapTest', async () => {
    const result = await waffle.loadFixture(() => fixtures(wallet))
    contract = result.swap
    token = result.token1
    unsupportedToken = result.token2
  })


  const outChain = '0x8000003c' // for ETH by SLIP-44
  const outToken = ethers.utils.toUtf8Bytes('OUT_TOKEN_ADDR')
  const receiver = '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211'
  const amount = 100

  describe('#requestSwap', () => {
    it('accepts a swap', async () => {
      await token.approve(contract.address, amount)
      const res = await contract.requestSwap(amount, token.address, outChain, outToken, receiver)
      const block = await ethers.provider.getBlock(res.blockNumber)
      const ts = block.timestamp

      const swap: Swap = { inToken: token.address, outToken, outChain, receiver, amount, ts }
      const swapId = getSwapId(swap)
      expect(await contract.doesSwapExist(swapId)).to.equal(true)
    })

    it('refuses unsupported token', async () => {
      await unsupportedToken.approve(contract.address, amount)
      await expect(
        contract.requestSwap(amount, contract.address, outChain, outToken, receiver)
      ).to.be.revertedWith('unsupported token')
    })
  })

  describe('#bondSwap', () => {
    it('can bond a swap', async () => {
      await token.approve(contract.address, amount)
      const res = await contract.requestSwap(amount, token.address, outChain, outToken, receiver)
      const block = await ethers.provider.getBlock(res.blockNumber)
      const ts = block.timestamp

      const swap: Swap = { inToken: token.address, outToken, outChain, receiver, amount, ts }
      const swapId = getSwapId(swap)

      await contract.bondSwap(swapId, wallet.address)
      expect(await contract.isSwapBonded(swapId)).to.equal(true)
      await expect(contract.bondSwap(swapId, wallet.address))
        .to.be.revertedWith('swap bonded')
    })
  })

  describe('#executeSwap', () => {
    it('can execute a swap', async () => {
      await token.approve(contract.address, amount)
      const res = await contract.requestSwap(amount, token.address, outChain, outToken, receiver)
      const block = await ethers.provider.getBlock(res.blockNumber)
      const ts = block.timestamp

      const swap: Swap = { inToken: token.address, outToken, outChain, receiver, amount, ts }
      const epoch = 0
      const swapId = getSwapId(swap)
      const signautre = signSwap(wallet, swapId, epoch)

      await contract.bondSwap(swapId, wallet.address)
      await contract.executeSwap(swapId, signautre, epoch)

      expect(await contract.doesSwapExist(swapId)).to.equal(false)
      expect(await token.balanceOf(wallet.address)).to.equal(1000000000)
    })
  })
})
