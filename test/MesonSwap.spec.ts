import { ethers, waffle } from 'hardhat'
import {
  MesonClient,
  EthersWalletSwapSigner,
  SwapWithSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} from '@mesonfi/sdk'
import { MockToken, MesonSwapTest } from '@mesonfi/contract-types'

import { expect } from './shared/expect'
import { initiator, poolOwner } from './shared/wallet'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { getPartialSwap, TestAddress } from './shared/meson'

describe('MesonSwap', () => {
  const outChain = '0x1234'
  
  let token: MockToken
  let unsupportedToken: MockToken

  let mesonInstance: MesonSwapTest
  let mesonClientForInitiator: MesonClient
  let mesonClientForPoolOwner: MesonClient

  let swap: SwapWithSigner
  let signedRequest: SignedSwapRequest
  let signedRelease: SignedSwapRelease

  beforeEach('deploy MesonSwapTest', async () => {
    const result = await waffle.loadFixture(() => fixtures([
      initiator.address, poolOwner.address
    ]))
    token = result.token1.connect(initiator)
    unsupportedToken = result.token2.connect(initiator)
    mesonInstance = result.swap // default account is signer

    const swapSigner = new EthersWalletSwapSigner(initiator)
    mesonClientForInitiator = await MesonClient.Create((mesonInstance as any).connect(initiator), swapSigner) // user is default account
    mesonClientForPoolOwner = await MesonClient.Create((mesonInstance as any).connect(poolOwner))
    
    await mesonInstance.connect(poolOwner).register(1)

    swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
    const signedRequestData = await swap.signForRequest(true)
    signedRequest = new SignedSwapRequest(signedRequestData)

    const signedReleaseData = await swap.signForRelease(TestAddress, true)
    signedRelease = new SignedSwapRelease(signedReleaseData)
  })


  describe('#postSwap', () => {
    it('rejects incorrect encoding version', async () => {
      const swap2 = new SwapWithSigner({ ...swap.toObject(), version: 0 }, swap.swapSigner)
      const signedRequestData = await swap2.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)

      await expect(mesonClientForPoolOwner.postSwap(signedRequest)).to.be.revertedWith('Incorrect encoding version')
    })
    it('rejects incorrect inChain', async () => {
      const swap2 = new SwapWithSigner({ ...swap.toObject(), inChain: '0x0001' }, swap.swapSigner)
      const signedRequestData = await swap2.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)

      await expect(mesonClientForPoolOwner.postSwap(signedRequest)).to.be.revertedWith('Swap not for this chain')
    })
    it('rejects unsupported token', async () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap({ inToken: 2 }), outChain)
      const signedRequestData = await swap.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)

      await expect(mesonClientForPoolOwner.postSwap(signedRequest))
        .to.be.revertedWith('Token not supported')
    })
    it('rejects if expireTs is too early', async () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain, 3600 - 600)
      const signedRequestData = await swap.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)

      await expect(mesonClientForPoolOwner.postSwap(signedRequest)).to.be.revertedWith('Expire ts too early')
    })
    it('rejects if expireTs is too late ', async () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain, 7200 + 1200)
      const signedRequestData = await swap.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)

      await expect(mesonClientForPoolOwner.postSwap(signedRequest)).to.be.revertedWith('Expire ts too late')
    })

    it('rejects if amount > 100k', async () => {
      const amount = ethers.utils.parseUnits('100001', 6)
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap({ amount }), outChain)
      const signedRequestData = await swap.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)

      await expect(mesonClientForPoolOwner.postSwap(signedRequest))
        .to.be.revertedWith('For security reason, amount cannot be greater than 100k')
    })

    const amount = ethers.utils.parseUnits('1000', 6)
    it('posts a valid swap', async () => {
      await token.connect(initiator).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.postSwap(signedRequest)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(initiator.address)
      expect(posted.poolOwner).to.equal(poolOwner.address)
      expect(posted.exist).to.equal(true)
      
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(amount))
      expect(await token.balanceOf(mesonInstance.address)).to.equal(amount)
    })
    it('rejects if swap already exists', async () => {
      await token.connect(initiator).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.postSwap(signedRequest)

      await expect(mesonClientForPoolOwner.postSwap(signedRequest)).to.be.revertedWith('Swap already exists')
    })
  })

  describe('#bondSwap', () => {
    it('rejects if swap does not exist', async () => {
      await expect(mesonInstance.bondSwap(swap.encoded, 1))
        .to.be.revertedWith('Swap does not exist')
    })

    const amount = ethers.utils.parseUnits('1000', 6)
    it('rejects if swap bonded to others', async () => {
      await token.connect(initiator).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.postSwap(signedRequest)

      await expect(mesonInstance.bondSwap(swap.encoded, 2))
        .to.be.revertedWith('Swap bonded to another pool')
    })
    it('rejects if poolIndex is not for signer', async () => {
      await token.connect(initiator).approve(mesonInstance.address, amount)
      await mesonInstance.postSwap(
        signedRequest.encoded,
        signedRequest.signature[0],
        signedRequest.signature[1],
        signedRequest.signature[2],
        ethers.utils.solidityPack(['address', 'uint40'], [signedRequest.initiator, 0])
      )
      await expect(mesonInstance.bondSwap(swap.encoded, 1))
        .to.be.revertedWith('Signer should be an authorized address of the given pool')
    })
    it('bonds a valid swap', async () => {
      await token.connect(initiator).approve(mesonInstance.address, amount)
      await mesonInstance.postSwap(
        signedRequest.encoded,
        signedRequest.signature[0],
        signedRequest.signature[1],
        signedRequest.signature[2],
        ethers.utils.solidityPack(['address', 'uint40'], [signedRequest.initiator, 0])
      )
      await mesonInstance.connect(poolOwner).bondSwap(swap.encoded, 1)
    })
  })

  describe('#cancelSwap', () => {
    it('rejects if swap does not exist', async () => {
      await expect(mesonClientForPoolOwner.cancelSwap(swap.encoded))
        .to.be.revertedWith('Swap does not exist')
    })

    const amount = ethers.utils.parseUnits('1000', 6)
    it('rejects if swap does not expire', async () => {
      await token.connect(initiator).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.postSwap(signedRequest)

      await expect(mesonClientForPoolOwner.cancelSwap(swap.encoded))
        .to.be.revertedWith('Swap is still locked')
    })
    it('cancels a valid swap', async () => {
      await token.connect(initiator).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.postSwap(signedRequest)

      await ethers.provider.send('evm_increaseTime', [5400])

      await mesonClientForPoolOwner.cancelSwap(swap.encoded)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(ethers.constants.AddressZero)
      expect(posted.poolOwner).to.equal(ethers.constants.AddressZero)
      expect(posted.exist).to.equal(false)
      
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE)
      expect(await token.balanceOf(mesonInstance.address)).to.equal(0)

      await ethers.provider.send('evm_increaseTime', [-5400])
    })
  })

  describe('#executeSwap', () => {
    it('rejects if swap does not exist', async () => {
      await expect(mesonClientForPoolOwner.executeSwap(signedRelease, true))
        .to.be.revertedWith('Swap does not exist')
    })

    const amount = ethers.utils.parseUnits('1000', 6)
    it('executes a valid swap and deposit to pool', async () => {
      await token.connect(initiator).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.postSwap(signedRequest)

      await mesonClientForPoolOwner.executeSwap(signedRelease, true)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(ethers.constants.AddressZero)
      expect(posted.poolOwner).to.equal(ethers.constants.AddressZero)
      expect(posted.exist).to.equal(true)

      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(amount))
      expect(await token.balanceOf(poolOwner.address)).to.equal(TOKEN_BALANCE)
      expect(await token.balanceOf(mesonInstance.address)).to.equal(amount)
      expect(await mesonInstance.poolTokenBalance(token.address, poolOwner.address)).to.equal(amount)
    })
    it('executes a valid swap and withdraw', async () => {
      await token.connect(initiator).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.postSwap(signedRequest)

      await mesonClientForPoolOwner.executeSwap(signedRelease, false)

      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(amount))
      expect(await token.balanceOf(poolOwner.address)).to.equal(TOKEN_BALANCE.add(amount))
      expect(await token.balanceOf(mesonInstance.address)).to.equal(0)
    })
    it('executes a valid swap after some time', async () => {
      await token.connect(initiator).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.postSwap(signedRequest)

      await ethers.provider.send('evm_increaseTime', [3600])

      await mesonClientForPoolOwner.executeSwap(signedRelease, true)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(ethers.constants.AddressZero)
      expect(posted.poolOwner).to.equal(ethers.constants.AddressZero)
      expect(posted.exist).to.equal(false)

      await ethers.provider.send('evm_increaseTime', [-3600])
    })
  })

  describe('#getPostedSwap', () => {
    const amount = ethers.utils.parseUnits('1000', 6)
    it('returns the posted swap', async () => {
      await token.connect(initiator).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.postSwap(signedRequest)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(initiator.address)
      expect(posted.poolOwner).to.equal(poolOwner.address)
      expect(posted.exist).to.equal(true)
    })
  })
})
