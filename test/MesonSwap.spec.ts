import { waffle } from 'hardhat'
import { MesonClient } from '@meson/sdk'
import { MockToken, MesonSwapTest } from '@meson/contract-typs'

import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('MesonSwap', () => {
  let mesonInstance: MesonSwapTest
  let token: MockToken
  let unsupportedToken: MockToken
  let outChain: string
  let mesonClient: MesonClient

  beforeEach('deploy MesonSwapTest', async () => {
    const result = await waffle.loadFixture(() => fixtures([
      initiator.address, provider.address
    ]))
    mesonInstance = result.swap.connect(provider)
    token = result.token1.connect(initiator)
    unsupportedToken = result.token2.connect(initiator)

    outChain = await mesonInstance.getCoinType()
    mesonClient = await MesonClient.Create(mesonInstance)
  })


  describe('#postSwap', () => {
    it('posts a swap', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ inToken: token.address }))
      const serializedRequest = await swap.serializeRequest(initiator)

      const req = mesonClient.parseRequest(serializedRequest)
      await token.approve(mesonInstance.address, swap.amount)
      await req.post(initiator.address)

      expect(await mesonInstance.hasSwap(swap.id())).to.equal(true)
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(swap.amount))
    })

    it('refuses unsupported token', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ inToken: unsupportedToken.address }))
      const serializedRequest = await swap.serializeRequest(initiator)

      const req = mesonClient.parseRequest(serializedRequest)
      await unsupportedToken.approve(mesonInstance.address, swap.amount)
      await expect(req.post(initiator.address)).to.be.revertedWith('unsupported token')
    })
  })

  describe('#executeSwap', () => {
    it('can execute a swap', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ inToken: token.address }))
      const serializedRequest = await swap.serializeRequest(initiator)

      const req = mesonClient.parseRequest(serializedRequest)
      await token.approve(mesonInstance.address, swap.amount)
      await req.post(initiator.address)

      const releaseSignatures = await swap.signRelease(initiator)
      await req.execute(releaseSignatures)

      expect(await mesonInstance.hasSwap(swap.id())).to.equal(false)
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(swap.amount))
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE.add(swap.amount))
    })
  })
})
