import { waffle } from 'hardhat'
import { MesonClient, SignedSwapRequest } from '@meson/sdk'
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
      const exported = await swap.exportRequest(initiator)

      const signedSwap = new SignedSwapRequest(exported)
      await token.approve(mesonInstance.address, swap.amount)
      await mesonClient.post(signedSwap)

      expect(await mesonInstance.hasSwap(swap.swapId)).to.equal(true)
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(swap.amount))
    })

    it('refuses unsupported token', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ inToken: unsupportedToken.address }))
      const exported = await swap.exportRequest(initiator)

      const signedSwap = new SignedSwapRequest(exported)
      await unsupportedToken.approve(mesonInstance.address, swap.amount)
      await expect(mesonClient.post(signedSwap)).to.be.revertedWith('unsupported token')
    })
  })

  describe('#executeSwap', () => {
    it('can execute a swap', async () => {
      const swap = mesonClient.requestSwap(outChain, getDefaultSwap({ inToken: token.address }))
      const exported = await swap.exportRequest(initiator)

      const signedSwap = new SignedSwapRequest(exported)
      await token.approve(mesonInstance.address, swap.amount)
      await mesonClient.post(signedSwap)

      const releaseSignature = await swap.signRelease(initiator)
      await mesonClient.execute(signedSwap, releaseSignature)

      expect(await mesonInstance.hasSwap(swap.swapId)).to.equal(false)
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(swap.amount))
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE.add(swap.amount))
    })
  })
})
