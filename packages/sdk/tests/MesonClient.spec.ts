import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { solidity, MockProvider } from 'ethereum-waffle';
import { Wallet, ContractFactory, utils, constants } from 'ethers'
import { Meson, MockToken } from '@mesonfi/contract-types'
import { ERC20 as ERC20Abi, Meson as MesonAbi } from '@mesonfi/contract-abis'

import {
  MesonClient,
  PostedSwapStatus,
  LockedSwapStatus,
  EthersWalletSwapSigner,
  SwapWithSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} from '../src'
import { getPartialSwap } from './shared'

const outChain = '0x003c'
const unsupportedTokenIndex = 2
const TestAddress = '0x7F342A0D04B951e8600dA1eAdD46afe614DaC20B'

chai.use(chaiAsPromised)
chai.use(solidity)

describe('MesonClient', () => {
  let initiator: Wallet
  let poolOwner: Wallet
  let token: MockToken
  let tokenIndex: number
  let mesonInstance: Meson
  let mesonClientForInitiator: MesonClient
  let mesonClientForPoolOwner: MesonClient

  beforeEach('deploy Meson contract', async () => {
    const wallets = new MockProvider().getWallets()
    initiator = wallets[1]
    poolOwner = wallets[2]
    const swapSigner = new EthersWalletSwapSigner(initiator)

    tokenIndex = 1
    const tokenFactory = new ContractFactory(ERC20Abi.abi, ERC20Abi.bytecode, wallets[0])
    token = await tokenFactory.deploy('MockToken', 'MT', utils.parseUnits('10000', 6), 6) as MockToken
    await token.transfer(initiator.address, utils.parseUnits('3000', 6))
    await token.transfer(poolOwner.address, utils.parseUnits('5000', 6))

    const mesonFactory = new ContractFactory(MesonAbi.abi, MesonAbi.bytecode, wallets[0])
    mesonInstance = await mesonFactory.deploy(poolOwner.address) as Meson
    await mesonInstance.addMultipleSupportedTokens([token.address], [tokenIndex])
    mesonClientForInitiator = await MesonClient.Create(mesonInstance.connect(initiator), swapSigner)
    mesonClientForPoolOwner = await MesonClient.Create(mesonInstance.connect(poolOwner))
  })

  describe('#shortCoinType', () => {
    it('returns the shortCoinType', () => {
      expect(mesonClientForInitiator.shortCoinType).to.equal('0x003c')
      expect(mesonClientForPoolOwner.shortCoinType).to.equal('0x003c')
    })
  })

  describe('#token', () => {
    it('rejects 0 or undefined index', () => {
      expect(() => mesonClientForInitiator.tokenAddr()).to.throw('Token index cannot be zero')
      expect(() => mesonClientForInitiator.tokenAddr(0)).to.throw('Token index cannot be zero')
    })
    it('returns token for an in-range index', () => {
      expect(mesonClientForInitiator.tokenAddr(1)).to.equal(token.address.toLowerCase())
    })
    it('returns undefined for out-of-range index', () => {
      expect(mesonClientForInitiator.tokenAddr(2)).to.equal(undefined)
    })
  })

  describe('#requestSwap', () => {
    it('rejects if swap signer is not set', async () => {
      const mesonClientForPoolOwner = await MesonClient.Create(mesonInstance)
      expect(() => mesonClientForPoolOwner.requestSwap(getPartialSwap(), outChain))
        .to.throw('No swap signer assigned')
    })
    it('returns a SwapWithSigner if swap signer is set', () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      expect(swap).to.be.an.instanceof(SwapWithSigner)
    })
  })

  describe('#depositAndRegister', () => {
    const amount = utils.parseUnits('100', 6)
    it('rejects unsupported token', async () => {
      await expect(mesonClientForPoolOwner.depositAndRegister(unsupportedTokenIndex, amount, '1'))
        .to.be.rejectedWith('Token not supported')
  })
    it('accepts a supported token deposit', async () => {
      await token.connect(poolOwner).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(tokenIndex, amount, '1')
    })
  })

  describe('#deposit', () => {
    const amount = utils.parseUnits('100', 6)
    it('rejects unsupported token', async () => {
      await token.connect(poolOwner).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(tokenIndex, amount, '1')
      await expect(mesonClientForPoolOwner.deposit(unsupportedTokenIndex, '1'))
        .to.be.rejectedWith('Token not supported')
    })

    it('accepts a supported token deposit', async () => {
      const amount = utils.parseUnits('10', 6)
      await token.connect(poolOwner).approve(mesonInstance.address, utils.parseUnits('100', 6))
      await mesonClientForPoolOwner.depositAndRegister(tokenIndex, amount, '1')
      await mesonClientForPoolOwner.deposit(tokenIndex, amount)
    })
  })

  describe('#postSwap', () => {
    let signedRequest

    beforeEach('prepare for postSwap', async () => {
      await token.connect(initiator).approve(mesonInstance.address, utils.parseUnits('1000', 6))

      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)

      await token.connect(poolOwner).approve(mesonInstance.address, 1)
      await mesonClientForPoolOwner.depositAndRegister(tokenIndex, '1', '1')
    })

    it('rejects unregistered pool owner', async () => {
      await expect(mesonClientForInitiator.postSwap(signedRequest))
        .to.be.rejectedWith(/not registered/)
    })

    it('accepts registered pool owner', async () => {
      await mesonClientForPoolOwner.postSwap(signedRequest)
    })
  })

  describe('#lockSwap', () => {
    let swap

    beforeEach('prepare for lock', async () => {
      swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)

      const amount = utils.parseUnits('999', 6)
      await token.connect(poolOwner).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(tokenIndex, amount, '1')
    })

    it('locks a swap', async () => {
      await mesonClientForPoolOwner.lockSwap(swap.encoded, initiator.address)
    })
  })

  describe('#unlock', () => {
    let swap
    let signedRequest

    beforeEach('prepare for unlock', async () => {
      swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)

      const amount = utils.parseUnits('999', 6)
      await token.connect(poolOwner).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(tokenIndex, amount, '1')
    })

    it('tries to unlock a swap', async () => {
      await mesonClientForPoolOwner.lockSwap(swap.encoded, initiator.address)
      await expect(mesonClientForPoolOwner.unlock(signedRequest))
        .to.be.revertedWith('Swap still in lock')
    })
  })

  describe('#release', () => {
    let swap
    let signedRelease

    beforeEach('prepare for release', async () => {
      swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedReleaseData = await swap.signForRelease(TestAddress, true)
      signedRelease = new SignedSwapRelease(signedReleaseData)

      const amount = utils.parseUnits('999', 6)
      await token.connect(poolOwner).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(tokenIndex, amount, '1')
    })

    it('releases a swap', async () => {
      await mesonClientForPoolOwner.lockSwap(swap.encoded, initiator.address)
      await mesonClientForPoolOwner.release(signedRelease)
    })
  })

  describe('#executeSwap', () => {
    let signedRequest
    let signedRelease

    beforeEach('prepare for lock', async () => {
      await token.connect(initiator).approve(mesonInstance.address, utils.parseUnits('1000', 6))

      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)
      const signedReleaseData = await swap.signForRelease(TestAddress, true)
      signedRelease = new SignedSwapRelease(signedReleaseData)

      await token.connect(poolOwner).approve(mesonInstance.address, 1)
      await mesonClientForPoolOwner.depositAndRegister(tokenIndex, '1', '1')
    })

    it('executes a swap', async () => {
      await mesonClientForPoolOwner.postSwap(signedRequest)
      await mesonClientForPoolOwner.executeSwap(signedRelease, true)
    })
  })

  describe('#cancelSwap', () => {
    let swap
    let signedRequest

    beforeEach('prepare for cancel', async () => {
      await token.connect(initiator).approve(mesonInstance.address, utils.parseUnits('1000', 6))

      swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)

      await token.connect(poolOwner).approve(mesonInstance.address, 1)
      await mesonClientForPoolOwner.depositAndRegister(tokenIndex, '1', '1')
    })

    it('tries to cancel a swap', async () => {
      await mesonClientForPoolOwner.postSwap(signedRequest)
      await expect(mesonClientForPoolOwner.cancelSwap(swap.encoded))
        .to.be.revertedWith('Swap is still locked')
    })
  })

  describe('#getPostedSwap', () => {
    let swap
    let signedRequest

    beforeEach('prepare for getPostedSwap', async () => {
      await token.connect(initiator).approve(mesonInstance.address, utils.parseUnits('1000', 6))

      swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)

      await token.connect(poolOwner).approve(mesonInstance.address, 1)
      await mesonClientForPoolOwner.depositAndRegister(tokenIndex, '1', '1')

      await mesonClientForPoolOwner.postSwap(signedRequest)
    })

    it('rejects invalid encoded', async () => {
      await expect(mesonClientForInitiator.getPostedSwap(''))
        .to.be.rejectedWith(/Invalid encoded\./)
    })

    it('returns the posted swap', async () => {
      const posted = await mesonClientForInitiator.getPostedSwap(swap.encoded)
      expect(posted.status).to.equal(PostedSwapStatus.Bonded)
      expect(posted.initiator).to.equal(initiator.address)
      expect(posted.poolOwner).to.equal(poolOwner.address.toLowerCase())
    })
  })

  describe('#getLockedSwap', () => {
    let swap

    beforeEach('prepare for getLockedSwap', async () => {
      swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)

      const amount = utils.parseUnits('999', 6)
      await token.connect(poolOwner).approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(tokenIndex, amount, '1')

      await mesonClientForPoolOwner.lockSwap(swap.encoded, initiator.address)
    })

    it('returns the locked swap', async () => {
      const locked = await mesonClientForInitiator.getLockedSwap(swap.encoded, initiator.address)
      expect(locked.status).to.equal(LockedSwapStatus.Locked)
      expect(locked.poolOwner).to.equal(poolOwner.address.toLowerCase())
    })
  })
})
