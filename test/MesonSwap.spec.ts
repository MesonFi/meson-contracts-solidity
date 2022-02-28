import { ethers, waffle } from 'hardhat'
import {
  MesonClient,
  EthersWalletSwapSigner,
  SwapWithSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} from '@mesonfi/sdk'
import { MockToken, MesonSwapTest } from '@mesonfi/contract-types'
import { pack } from '@ethersproject/solidity'
import { AddressZero } from '@ethersproject/constants'

import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { getPartialSwap } from './shared/meson'

const outChain = '0x1234'
const TestAddress = '0x7F342A0D04B951e8600dA1eAdD46afe614DaC20B'

describe('MesonSwap', () => {
  let token: MockToken
  let unsupportedToken: MockToken

  let mesonInstance: MesonSwapTest
  let mesonClientForInitiator: MesonClient
  let mesonClientForProvider: MesonClient

  let swap: SwapWithSigner
  let signedRequest: SignedSwapRequest
  let signedRelease: SignedSwapRelease

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
    
    await mesonInstance.connect(provider).register(1)

    swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
    const signedRequestData = await swap.signForRequest(true)
    signedRequest = new SignedSwapRequest(signedRequestData)

    const signedReleaseData = await swap.signForRelease(TestAddress, true)
    signedRelease = new SignedSwapRelease(signedReleaseData)
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
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain, 7200 + 1200)
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
    it('rejects if swap does not exist', async () => {
      await expect(mesonInstance.bondSwap(swap.encoded, 1))
        .to.be.revertedWith('Swap does not exist')
    })
    it('rejects if swap bonded to others', async () => {
      await token.connect(initiator).approve(mesonInstance.address, 101)
      await mesonClientForProvider.postSwap(signedRequest)

      await expect(mesonInstance.bondSwap(swap.encoded, 2))
        .to.be.revertedWith('Swap bonded to another provider')
    })
    it('rejects if providerIndex is not for signer', async () => {
      await token.connect(initiator).approve(mesonInstance.address, 101)
      await mesonInstance.postSwap(
        signedRequest.encoded,
        signedRequest.signature[0],
        signedRequest.signature[1],
        signedRequest.signature[2],
        pack(['address', 'uint40'], [signedRequest.initiator, 0])
      )
      await expect(mesonInstance.bondSwap(swap.encoded, 1))
        .to.be.revertedWith('Can only bound to signer')
    })
    it('bonds a valid swap', async () => {
      await token.connect(initiator).approve(mesonInstance.address, 101)
      await mesonInstance.postSwap(
        signedRequest.encoded,
        signedRequest.signature[0],
        signedRequest.signature[1],
        signedRequest.signature[2],
        pack(['address', 'uint40'], [signedRequest.initiator, 0])
      )
      await mesonInstance.connect(provider).bondSwap(swap.encoded, 1)
    })
  })

  describe('#cancelSwap', () => {
    it('rejects if swap does not exist', async () => {
      await expect(mesonClientForProvider.cancelSwap(swap.encoded))
        .to.be.revertedWith('Swap does not exist')
    })
    it('rejects if swap does not expire', async () => {
      await token.connect(initiator).approve(mesonInstance.address, 101)
      await mesonClientForProvider.postSwap(signedRequest)

      await expect(mesonClientForProvider.cancelSwap(swap.encoded))
        .to.be.revertedWith('Swap is still locked')
    })
    it('cancels a valid swap', async () => {
      await token.connect(initiator).approve(mesonInstance.address, 101)
      await mesonClientForProvider.postSwap(signedRequest)

      await ethers.provider.send('evm_increaseTime', [5400])

      await mesonClientForProvider.cancelSwap(swap.encoded)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(AddressZero)
      expect(posted.provider).to.equal(AddressZero)
      expect(posted.executed).to.equal(false)
      
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE)
      expect(await token.balanceOf(mesonInstance.address)).to.equal(0)

      await ethers.provider.send('evm_increaseTime', [-5400])
    })
  })

  describe('#executeSwap', () => {
    it('rejects if swap does not exist', async () => {
      await expect(mesonClientForProvider.executeSwap(signedRelease, true))
        .to.be.revertedWith('Swap does not exist')
    })
    it('executes a valid swap and deposit to pool', async () => {
      await token.connect(initiator).approve(mesonInstance.address, 101)
      await mesonClientForProvider.postSwap(signedRequest)

      await mesonClientForProvider.executeSwap(signedRelease, true)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(AddressZero)
      expect(posted.provider).to.equal(AddressZero)
      expect(posted.executed).to.equal(true)

      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(101))
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE)
      expect(await token.balanceOf(mesonInstance.address)).to.equal(101)
      expect(await mesonInstance.balanceOf(token.address, provider.address)).to.equal(101)
    })
    it('executes a valid swap and withdraw', async () => {
      await token.connect(initiator).approve(mesonInstance.address, 101)
      await mesonClientForProvider.postSwap(signedRequest)

      await mesonClientForProvider.executeSwap(signedRelease, false)

      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(101))
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE.add(101))
      expect(await token.balanceOf(mesonInstance.address)).to.equal(0)
    })
    it('executes a valid swap after some time', async () => {
      await token.connect(initiator).approve(mesonInstance.address, 101)
      await mesonClientForProvider.postSwap(signedRequest)

      await ethers.provider.send('evm_increaseTime', [3600])

      await mesonClientForProvider.executeSwap(signedRelease, true)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(AddressZero)
      expect(posted.provider).to.equal(AddressZero)
      expect(posted.executed).to.equal(false)

      await ethers.provider.send('evm_increaseTime', [-3600])
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
