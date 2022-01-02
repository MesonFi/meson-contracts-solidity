import { waffle } from 'hardhat'
import { MesonClient } from '@meson/sdk'
import { MockToken, MesonSwapTest } from '@meson/contract-typs'

import { expect } from './shared/expect'
import { wallet } from './shared/wallet'
import { fixtures } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('MesonSwap', () => {
  let mesonInstance: MesonSwapTest
  let token: MockToken
  let unsupportedToken: MockToken
  let outChain: string
  let mesonClient: MesonClient

  beforeEach('deploy MesonSwapTest', async () => {
    const result = await waffle.loadFixture(() => fixtures(wallet))
    mesonInstance = result.swap
    token = result.token1
    unsupportedToken = result.token2

    outChain = await mesonInstance.getCurrentChain()
    mesonClient = await MesonClient.Create(mesonInstance)
  })


  describe('#postSwap', () => {
    it('posts a swap', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ inToken: token.address }))
      await token.approve(mesonInstance.address, swap.amount)

      const serializedRequest = await swap.serializeRequest(wallet)

      const req = mesonClient.parseRequest(serializedRequest)
      await req.post(wallet)

      expect(await mesonInstance.hasSwap(swap.id())).to.equal(true)
    })

    it('refuses unsupported token', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ inToken: unsupportedToken.address }))
      await unsupportedToken.approve(mesonInstance.address, swap.amount)

      const serializedRequest = await swap.serializeRequest(wallet)

      const req = mesonClient.parseRequest(serializedRequest)
      await expect(req.post(wallet)).to.be.revertedWith('unsupported token')
    })
  })

  describe('#executeSwap', () => {
    it('can execute a swap', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ inToken: token.address }))
      await token.approve(mesonInstance.address, swap.amount)

      const serializedRequest = await swap.serializeRequest(wallet)

      const req = mesonClient.parseRequest(serializedRequest)
      await req.post(wallet)

      const releaseSignatures = await swap.signRelease(wallet)
      await req.execute(releaseSignatures)

      expect(await mesonInstance.hasSwap(swap.id())).to.equal(false)
      expect(await token.balanceOf(wallet.address)).to.equal(1000000000)
    })
  })
})
