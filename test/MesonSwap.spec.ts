import { waffle } from 'hardhat'
import { MesonClient, SignedSwapRequest, SignedSwapRelease } from '@mesonfi/sdk'
import { MockToken, MesonSwapTest } from '@mesonfi/contract-typs'

import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'

describe('MesonSwap', () => {
  let token: MockToken
  let unsupportedToken: MockToken
  let mesonInstance: MesonSwapTest
  let outChain: string
  let userClient: MesonClient
  let lpClient: MesonClient

  beforeEach('deploy MesonSwapTest', async () => {
    const result = await waffle.loadFixture(() => fixtures([
      initiator.address, provider.address
    ]))
    token = result.token1.connect(initiator)
    unsupportedToken = result.token2.connect(initiator)
    mesonInstance = result.swap.connect(provider)

    outChain = await mesonInstance.getCoinType()
    userClient = await MesonClient.Create(result.swap)
    lpClient = await MesonClient.Create(mesonInstance)
  })


  describe('#postSwap', () => {
    it('posts a swap', async () => {
      const swap = userClient.requestSwap(outChain, getDefaultSwap({ inToken: token.address }))
      const exported = await swap.exportRequest(initiator)

      const signedRequest = new SignedSwapRequest(exported)
      await token.approve(mesonInstance.address, swap.amount)
      await lpClient.postSwap(signedRequest)

      expect(await mesonInstance.hasSwap(swap.swapId)).to.equal(true)
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(swap.amount))
    })

    it('refuses unsupported token', async () => {
      const swap = userClient.requestSwap(outChain, getDefaultSwap({ inToken: unsupportedToken.address }))
      const exported = await swap.exportRequest(initiator)

      const signedRequest = new SignedSwapRequest(exported)
      await unsupportedToken.approve(mesonInstance.address, swap.amount)
      await expect(lpClient.postSwap(signedRequest)).to.be.revertedWith('unsupported token')
    })
  })

  describe('#executeSwap', () => {
    it('can execute a swap', async () => {
      const swapData = getDefaultSwap({ inToken: token.address })
      const swap = userClient.requestSwap(outChain, swapData)
      const exported = await swap.exportRequest(initiator)
      
      const signedRequest = new SignedSwapRequest(exported)
      await token.approve(mesonInstance.address, swap.amount)
      await lpClient.postSwap(signedRequest)

      const exportedRelease = await swap.exportRelease(initiator, swapData.recipient)
      const signedRelease = new SignedSwapRelease(exportedRelease)
      await lpClient.executeSwap(signedRelease, false)

      expect(await mesonInstance.hasSwap(swap.swapId)).to.equal(false)
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(swap.amount))
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE.add(swap.amount))
    })
  })
})
