import { ethers, waffle } from 'hardhat'
import {
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} from '@mesonfi/sdk'
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
    mesonInstance = result.swap // default account is signer

    userClient = await MesonClient.Create(mesonInstance, new EthersWalletSwapSigner(initiator)) // user is default account
    lpClient = await MesonClient.Create(mesonInstance.connect(provider))
    await lpClient.mesonInstance.register(1)
    outChain = lpClient.shortCoinType
  })


  describe('#postSwap', () => {
    it('posts a swap', async () => {
      const swap = userClient.requestSwap(getDefaultSwap({ fee: '0' }), outChain)
      const exported = await swap.exportRequest()

      const signedRequest = new SignedSwapRequest(exported)
      signedRequest.checkSignature()
      await token.approve(mesonInstance.address, swap.amount)
      await lpClient.postSwap(signedRequest)

      expect(await mesonInstance.swapInitiator(swap.encoded)).to.equal(initiator.address)
      expect(await mesonInstance.swapProvider(swap.encoded)).to.equal(provider.address)
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(swap.amount))
    })

    it('refuses unsupported token', async () => {
      const swap = userClient.requestSwap(getDefaultSwap({ inToken: 2, fee: '0' }), outChain)
      const exported = await swap.exportRequest()

      const signedRequest = new SignedSwapRequest(exported)
      signedRequest.checkSignature()
      await unsupportedToken.approve(mesonInstance.address, swap.amount)
      await expect(lpClient.postSwap(signedRequest)).to.be.reverted
    })
  })

  describe('#executeSwap', () => {
    it('can execute a swap', async () => {
      const swapData = getDefaultSwap({ fee: '0' })
      const swap = userClient.requestSwap(swapData, outChain)
      const exported = await swap.exportRequest()
      
      const signedRequest = new SignedSwapRequest(exported)
      signedRequest.checkSignature()
      await token.approve(mesonInstance.address, swap.amount)
      await lpClient.postSwap(signedRequest)

      const exportedRelease = await swap.exportRelease(swapData.recipient)
      const signedRelease = new SignedSwapRelease(exportedRelease)
      signedRelease.checkSignature()
      await lpClient.executeSwap(signedRelease, false)

      expect(await mesonInstance.swapInitiator(swap.encoded)).to.equal(ethers.constants.AddressZero)
      expect(await mesonInstance.swapProvider(swap.encoded)).to.equal(ethers.constants.AddressZero)
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(swap.amount))
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE.add(swap.amount))
    })
  })
})
