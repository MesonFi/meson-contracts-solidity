import { ethers, waffle } from 'hardhat'
import {
  MesonClient,
  EthersWalletSwapSigner,
  SwapWithSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} from '@mesonfi/sdk'
import { MockToken, MesonSwapTest } from '@mesonfi/contract-typs'
import { keccak256 } from '@ethersproject/keccak256'
import { pack } from '@ethersproject/solidity'

import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { getPartialSwap } from './shared/meson'

const testnetMode = true
const outChain = '0x1234'

describe('MesonSwap', () => {
  let token: MockToken
  let unsupportedToken: MockToken

  let mesonInstance: MesonSwapTest
  let mesonClientForInitiator: MesonClient
  let mesonClientForProvider: MesonClient

  let swap: SwapWithSigner
  let signedRequest: SignedSwapRequest

  beforeEach('deploy MesonSwapTest', async () => {
    const result = await waffle.loadFixture(() => fixtures([
      initiator.address, provider.address
    ]))
    token = result.token1.connect(initiator)
    unsupportedToken = result.token2.connect(initiator)
    mesonInstance = result.swap // default account is signer

    const swapSigner = new EthersWalletSwapSigner(initiator)
    mesonClientForInitiator = await MesonClient.Create(mesonInstance.connect(initiator), swapSigner) // user is default account
    mesonClientForProvider = await MesonClient.Create(mesonInstance.connect(provider))
    
    await mesonClientForProvider.mesonInstance.register(1)

    swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
    const signedRequestData = await swap.signForRequest(true)
    signedRequest = new SignedSwapRequest(signedRequestData)
  })


  describe('#postSwap', () => {
    it('rejects incorrect inChain', async () => {
      const swap2 = new SwapWithSigner({ ...swap.toObject(), inChain: '0x0001' }, swap.swapSigner)
      const signedRequestData = await swap2.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)

      await expect(mesonClientForProvider.postSwap(signedRequest)).to.be.revertedWith('Swap not for this chain')
    })
    it('rejects unsupported token', async () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap({ inToken: 2 }), outChain)
      const signedRequestData = await swap.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)

      await expect(mesonClientForProvider.postSwap(signedRequest))
        .to.be.revertedWith('function call to a non-contract account')
    })
    it('rejects if expireTs is too early', async () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain, 3600 - 600)
      const signedRequestData = await swap.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)

      await expect(mesonClientForProvider.postSwap(signedRequest)).to.be.revertedWith('Expire ts too early')
    })
    it('rejects if expireTs is too late ', async () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain, 7200 + 600)
      const signedRequestData = await swap.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)

      await expect(mesonClientForProvider.postSwap(signedRequest)).to.be.revertedWith('Expire ts too late')
    })
    it('rejects if amount > 100k', async () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap({ amount: '100000000001' }), outChain)
      const signedRequestData = await swap.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)

      await expect(mesonClientForProvider.postSwap(signedRequest))
        .to.be.revertedWith('For security reason, amount cannot be greater than 100k')
    })
    it('posts a valid swap', async () => {
      await token.connect(initiator).approve(mesonInstance.address, 101)
      await mesonClientForProvider.postSwap(signedRequest)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(initiator.address)
      expect(posted.provider).to.equal(provider.address)
      expect(posted.executed).to.equal(false)
      
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(101))
      expect(await token.balanceOf(mesonInstance.address)).to.equal(101)
    })
    it('rejects if swap already exists', async () => {
      await token.connect(initiator).approve(mesonInstance.address, 101)
      await mesonClientForProvider.postSwap(signedRequest)

      await expect(mesonClientForProvider.postSwap(signedRequest)).to.be.revertedWith('Swap already exists')
    })
  })

  describe('#bondSwap', () => {
    it('', async () => {
    })
    it('', async () => {
    })
  })

  describe('#cancelSwap', () => {
    it('rejects if swap does not exist', async () => {
      await expect(mesonClientForProvider.cancelSwap(swap.encoded)).to.be.revertedWith('x')
    })
    it('rejects if swap does not expire', async () => {
      await token.connect(initiator).approve(mesonInstance.address, 101)
      await mesonClientForProvider.postSwap(signedRequest)

      await expect(mesonClientForProvider.cancelSwap(swap.encoded)).to.be.revertedWith('x')
    })
    it('rejects  Swap is still locked ', async () => {
      const swapData = getDefaultSwap({ fee: '0' })
      const swap = userClient.requestSwap(swapData, outChain)
      const request = await swap.signForRequest(testnetMode)
      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature(testnetMode)
      await mesonContract.postSwap(
        signedRequest.encoded,
        signedRequest.signature[0],
        signedRequest.signature[1],
        signedRequest.signature[2],
        pack(['address', 'uint40'], [
          signedRequest.initiator,
          '1'
        ])
      )
      try {
        await mesonContract.cancelSwap(signedRequest.encoded)
      } catch (error) {
        expect(error).to.match(/Swap is still locked/)
      }
    })
  })

  describe('#executeSwap', () => {
    it('accepts  bondSwap', async () => {
    })
    it('rejects swap does not exist ', async () => {
    })
    it('rejects Swap bonded to another provider ', async () => {
    })
    it('rejects  Can only bound to signer', async () => {
    })
    it('rejects swap does not exist', async () => {
    })
    it('can execute a swap', async () => {
      const swapData = getDefaultSwap({ fee: '0' })
      const swap = userClient.requestSwap(swapData, outChain)
      const request = await swap.signForRequest(testnetMode)
      
      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature(testnetMode)
      await token.approve(mesonInstance.address, swap.amount)
      await lpClient.postSwap(signedRequest)

      const release = await swap.signForRelease(swapData.recipient, testnetMode)
      const signedRelease = new SignedSwapRelease(release)
      signedRelease.checkSignature(testnetMode)
      await lpClient.executeSwap(signedRelease, false)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(ethers.constants.AddressZero)
      expect(posted.provider).to.equal(ethers.constants.AddressZero)
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(swap.amount))
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE.add(swap.amount))
    })
  })

  describe('#getPostedSwap', () => {
    it('returns the posted swap', async () => {
      await token.connect(initiator).approve(mesonInstance.address, 101)
      await mesonClientForProvider.postSwap(signedRequest)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(initiator.address)
      expect(posted.provider).to.equal(provider.address)
      expect(posted.executed).to.equal(false)
    })
  })
})
