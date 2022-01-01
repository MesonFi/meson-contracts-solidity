import { waffle, ethers } from 'hardhat'
import { MesonInterface } from '@meson/sdk'
import { MockToken, MesonSwapTest } from '@meson/contract-typs'

import { expect } from './shared/expect'
import { wallet } from './shared/wallet'
import { fixtures } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('MesonSwap', () => {
  let contract: MesonSwapTest
  let token: MockToken
  let unsupportedToken: MockToken
  let outChain: string
  let meson: MesonInterface

  beforeEach('deploy MesonSwapTest', async () => {
    const result = await waffle.loadFixture(() => fixtures(wallet))
    contract = result.swap
    token = result.token1
    unsupportedToken = result.token2

    outChain = await contract.getCurrentChain()
    meson = new MesonInterface({ mesonAddress: contract.address, chainId: '0x3' })
  })


  describe('#postSwap', () => {
    it('posts a swap', async () => {
      const swap = meson.requestSwap(outChain, getDefaultSwap({ inToken: token.address }))
      await token.approve(contract.address, swap.amount)

      const { r, s, v } = await meson.signer.signSwapRequest(swap, wallet)
      await contract.postSwap(swap.encode(), token.address, wallet.address, r, s, v)
      expect(await contract.isSwapExist(swap.id())).to.equal(true)
    })

    it('refuses unsupported token', async () => {
      const swap = meson.requestSwap(outChain, getDefaultSwap({ inToken: unsupportedToken.address }))
      await unsupportedToken.approve(contract.address, swap.amount)

      const { r, s, v } = await meson.signer.signSwapRequest(swap, wallet)
      await expect(
        contract.postSwap(swap.encode(), unsupportedToken.address, wallet.address, r, s, v)
      ).to.be.revertedWith('unsupported token')
    })
  })

  describe('#executeSwap', () => {
    it('can execute a swap', async () => {
      const swap = meson.requestSwap(outChain, getDefaultSwap({ inToken: token.address }))
      await token.approve(contract.address, swap.amount)

      const { r, s, v } = await meson.signer.signSwapRequest(swap, wallet)
      await contract.postSwap(swap.encode(), token.address, wallet.address, r, s, v)

      const { r: r2, s: s2, v: v2 } = await meson.signer.signSwapRelease(swap.id(), wallet)
      await contract.executeSwap(swap.id(), r2, s2, v2)

      expect(await contract.isSwapExist(swap.id())).to.equal(false)
      expect(await token.balanceOf(wallet.address)).to.equal(1000000000)
    })
  })
})
