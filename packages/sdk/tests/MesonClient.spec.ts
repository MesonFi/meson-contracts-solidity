import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { solidity, MockProvider } from 'ethereum-waffle';
import { parseUnits } from '@ethersproject/units'
import { Wallet } from '@ethersproject/wallet'
import { ContractFactory } from '@ethersproject/contracts'
import { AddressZero } from '@ethersproject/constants'
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
const unsupported = AddressZero
const TestAddress = '0x7F342A0D04B951e8600dA1eAdD46afe614DaC20B'

chai.use(chaiAsPromised)
chai.use(solidity)

describe('MesonClient', () => {
  let initiator: Wallet
  let provider: Wallet
  let token: MockToken
  let mesonInstance: Meson
  let mesonClientForInitiator: MesonClient
  let mesonClientForProvider: MesonClient

  beforeEach('deploy Meson contract', async () => {
    const wallets = new MockProvider().getWallets()
    initiator = wallets[1]
    provider = wallets[2]
    const swapSigner = new EthersWalletSwapSigner(initiator)

    const tokenFactory = new ContractFactory(ERC20Abi.abi, ERC20Abi.bytecode, wallets[0])
    token = await tokenFactory.deploy('MockToken', 'MT', parseUnits('10000', 6), 6) as MockToken
    await token.transfer(initiator.address, parseUnits('3000', 6))
    await token.transfer(provider.address, parseUnits('5000', 6))

    const mesonFactory = new ContractFactory(MesonAbi.abi, MesonAbi.bytecode, wallets[0])
    mesonInstance = await mesonFactory.deploy([token.address]) as Meson
    mesonClientForInitiator = await MesonClient.Create(mesonInstance.connect(initiator), swapSigner)
    mesonClientForProvider = await MesonClient.Create(mesonInstance.connect(provider))
  })

  describe('#shortCoinType', () => {
    it('returns the shortCoinType', () => {
      expect(mesonClientForInitiator.shortCoinType).to.equal('0x003c')
      expect(mesonClientForProvider.shortCoinType).to.equal('0x003c')
    })
  })

  describe('#token', () => {
    it('rejects 0 or undefined index', () => {
      expect(() => mesonClientForInitiator.token()).to.throw('Token index cannot be zero')
      expect(() => mesonClientForInitiator.token(0)).to.throw('Token index cannot be zero')
    })
    it('returns token for an in-range index', () => {
      expect(mesonClientForInitiator.token(1)).to.equal(token.address.toLowerCase())
    })
    it('returns undefined for out-of-range index', () => {
      expect(mesonClientForInitiator.token(2)).to.equal(undefined)
    })
  })

  describe('#requestSwap', () => {
    it('rejects if swap signer is not set', async () => {
      const mesonClientForProvider = await MesonClient.Create(mesonInstance)
      expect(() => mesonClientForProvider.requestSwap(getPartialSwap(), outChain))
        .to.throw('No swap signer assigned')
    })
    it('returns a SwapWithSigner if swap signer is set', () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      expect(swap).to.be.an.instanceof(SwapWithSigner)
    })
  })

  describe('#depositAndRegister', () => {
    const amount = parseUnits('100', 6)
    it('rejects unsupported token', async () => {
      await expect(mesonClientForProvider.depositAndRegister(unsupported, amount, '1'))
        .to.be.rejectedWith('Token not supported')
    })
    it('accepts a supported token deposit', async () => {
      await token.connect(provider).approve(mesonInstance.address, amount)
      await mesonClientForProvider.depositAndRegister(token.address, amount, '1')
    })
  })

  describe('#deposit', () => {
    it('rejects unsupported token', async () => {
      await expect(mesonClientForProvider.deposit(unsupported, '1'))
        .to.be.rejectedWith('Token not supported')
    })

    it('accepts a supported token deposit', async () => {
      const amount = parseUnits('10', 6)
      await token.connect(provider).approve(mesonInstance.address, parseUnits('100', 6))
      await mesonClientForProvider.depositAndRegister(token.address, amount, '1')
      await mesonClientForProvider.deposit(token.address, amount)
    })
  })

  describe('#postSwap', () => {
    let signedRequest

    beforeEach('prepare for postSwap', async () => {
      await token.connect(initiator).approve(mesonInstance.address, parseUnits('1001', 6))

      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)

      await token.connect(provider).approve(mesonInstance.address, 1)
      await mesonClientForProvider.depositAndRegister(token.address, '1', '1')
    })

    it('rejects unregistered provider', async () => {
      await expect(mesonClientForInitiator.postSwap(signedRequest))
        .to.be.rejectedWith(/not registered/)
    })

    it('accepts registered provider', async () => {
      await mesonClientForProvider.postSwap(signedRequest)
    })
  })

  describe('#lock', () => {
    let signedRequest

    beforeEach('prepare for lock', async () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)

      const amount = parseUnits('1000', 6)
      await token.connect(provider).approve(mesonInstance.address, amount)
      await mesonClientForProvider.depositAndRegister(token.address, amount, '1')
    })

    it('locks a swap', async () => {
      await mesonClientForProvider.lock(signedRequest)
    })
  })

  describe('#unlock', () => {
    let signedRequest

    beforeEach('prepare for unlock', async () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)

      const amount = parseUnits('1000', 6)
      await token.connect(provider).approve(mesonInstance.address, amount)
      await mesonClientForProvider.depositAndRegister(token.address, amount, '1')
    })

    it('tries to unlock a swap', async () => {
      await mesonClientForProvider.lock(signedRequest)
      await expect(mesonClientForProvider.unlock(signedRequest))
        .to.be.revertedWith('Swap still in lock')
    })
  })

  describe('#release', () => {
    let signedRequest
    let signedRelease

    beforeEach('prepare for release', async () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)
      const signedReleaseData = await swap.signForRelease(TestAddress, true)
      signedRelease = new SignedSwapRelease(signedReleaseData)

      const amount = parseUnits('1000', 6)
      await token.connect(provider).approve(mesonInstance.address, amount)
      await mesonClientForProvider.depositAndRegister(token.address, amount, '1')
    })

    it('releases a swap', async () => {
      await mesonClientForProvider.lock(signedRequest)
      await mesonClientForProvider.release(signedRelease)
    })
  })

  describe('#executeSwap', () => {
    let signedRequest
    let signedRelease

    beforeEach('prepare for lock', async () => {
      await token.connect(initiator).approve(mesonInstance.address, parseUnits('1001', 6))

      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)
      const signedReleaseData = await swap.signForRelease(TestAddress, true)
      signedRelease = new SignedSwapRelease(signedReleaseData)

      await token.connect(provider).approve(mesonInstance.address, 1)
      await mesonClientForProvider.depositAndRegister(token.address, '1', '1')
    })

    it('executes a swap', async () => {
      await mesonClientForProvider.postSwap(signedRequest)
      await mesonClientForProvider.executeSwap(signedRelease, true)
    })
  })

  describe('#cancelSwap', () => {
    let signedRequest

    beforeEach('prepare for cancel', async () => {
      await token.connect(initiator).approve(mesonInstance.address, parseUnits('1001', 6))

      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)

      await token.connect(provider).approve(mesonInstance.address, 1)
      await mesonClientForProvider.depositAndRegister(token.address, '1', '1')
    })

    it('tries to cancel a swap', async () => {
      await mesonClientForProvider.postSwap(signedRequest)
      await expect(mesonClientForProvider.cancelSwap(signedRequest.encoded))
        .to.be.revertedWith('Swap is still locked')
    })
  })

  describe('#getPostedSwap', () => {
    let signedRequest

    beforeEach('prepare for getPostedSwap', async () => {
      await token.connect(initiator).approve(mesonInstance.address, parseUnits('1001', 6))

      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)

      await token.connect(provider).approve(mesonInstance.address, 1)
      await mesonClientForProvider.depositAndRegister(token.address, '1', '1')

      await mesonClientForProvider.postSwap(signedRequest)
    })

    it('rejects invalid encoded', async () => {
      await expect(mesonClientForInitiator.getPostedSwap(''))
        .to.be.rejectedWith(/Invalid encoded\./)
    })

    it('returns the posted swap', async () => {
      const posted = await mesonClientForInitiator.getPostedSwap(signedRequest.encoded)
      expect(posted.status).to.equal(PostedSwapStatus.Bonded)
      expect(posted.initiator).to.equal(initiator.address)
      expect(posted.provider).to.equal(provider.address)
    })
  })

  describe('#getLockedSwap', () => {
    let signedRequest

    beforeEach('prepare for getLockedSwap', async () => {
      const swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
      const signedRequestData = await swap.signForRequest(true)
      signedRequest = new SignedSwapRequest(signedRequestData)

      const amount = parseUnits('1000', 6)
      await token.connect(provider).approve(mesonInstance.address, amount)
      await mesonClientForProvider.depositAndRegister(token.address, amount, '1')

      await mesonClientForProvider.lock(signedRequest)
    })

    it('returns the locked swap', async () => {
      const locked = await mesonClientForInitiator.getLockedSwap(signedRequest.encoded, initiator.address)
      expect(locked.status).to.equal(LockedSwapStatus.Locked)
      expect(locked.provider).to.equal(provider.address)
    })
  })
})
