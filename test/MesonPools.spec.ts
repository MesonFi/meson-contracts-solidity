import { waffle } from 'hardhat'
import {
  MesonClient,
  LockedSwapStatus,
  EthersWalletSwapSigner,
  SwapWithSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} from '@mesonfi/sdk/src'
import { MockToken, MesonPoolsTest } from '@mesonfi/contract-types'
import { pack } from '@ethersproject/solidity'
import { AddressZero } from '@ethersproject/constants'

import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE, TOKEN_TOTAL_SUPPLY } from './shared/fixtures'
import { getPartialSwap } from './shared/meson'

const testnetMode = true
const TestAddress = '0x7F342A0D04B951e8600dA1eAdD46afe614DaC20B'

describe('MesonPools', () => {
  let token: MockToken
  let outChain: string

  let mesonInstance: MesonPoolsTest
  let mesonClientForInitiator: MesonClient
  let mesonClientForProvider: MesonClient

  let swap: SwapWithSigner
  let signedRequest: SignedSwapRequest
  let signedRelease: SignedSwapRelease

  beforeEach('deploy MesonPoolsTest', async () => {
    const result = await waffle.loadFixture(() => fixtures([
      initiator.address, provider.address
    ]))
    token = result.token1.connect(provider)
    mesonInstance = result.pools.connect(provider) // provider is signer

    const swapSigner = new EthersWalletSwapSigner(initiator)
    mesonClientForInitiator = await MesonClient.Create(result.pools, swapSigner)
    mesonClientForProvider = await MesonClient.Create((mesonInstance as any).connect(provider))
    outChain = mesonClientForProvider.shortCoinType

    swap = mesonClientForInitiator.requestSwap(getPartialSwap(), outChain)
    const signedRequestData = await swap.signForRequest(true)
    signedRequest = new SignedSwapRequest(signedRequestData)

    const signedReleaseData = await swap.signForRelease(TestAddress, true)
    signedRelease = new SignedSwapRelease(signedReleaseData)
  })

  describe('#token', () => {
    it('balance', async () => {
      expect(await token.totalSupply()).to.equal(TOKEN_TOTAL_SUPPLY)
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE)
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE)
      expect(await token.balanceOf(mesonInstance.address)).to.equal(0)
    })
  })

  describe('#depositAndRegister', () => {
    it('rejects zero provider index', async () => {
      await expect(mesonClientForProvider.depositAndRegister(token.address, '100', '0'))
        .to.be.revertedWith('Cannot use 0 as provider index')
    })
    it('rejects zero amount', async () => {
      await expect(mesonClientForProvider.depositAndRegister(token.address, '0', '1'))
        .to.be.revertedWith('Amount must be positive')
    })
    it('rejects if token not supported', async () => {
      await expect(mesonClientForProvider.depositAndRegister(TestAddress, '100', '1'))
        .to.be.rejectedWith('Token not supported')

      const balanceIndex = pack(['uint8', 'uint40'], [2, 1])
      await expect(mesonInstance.depositAndRegister(100, balanceIndex))
        .to.be.revertedWith('function call to a non-contract account')
    })
    it('rejects if not approved', async () => {
      await token.approve(mesonInstance.address, '99')
      await expect(mesonClientForProvider.depositAndRegister(token.address, '100', '1'))
        .to.be.revertedWith('ERC20: transfer amount exceeds allowance')
    })
    it('accepts a valid depositAndRegister', async () => {
      await token.approve(mesonInstance.address, '100')
      await mesonClientForProvider.depositAndRegister(token.address, '100', '1')
      expect(await mesonInstance.balanceOf(token.address, provider.address)).to.equal('100')
    })
    it('rejects if index is already registered', async () => {
      await token.approve(mesonInstance.address, '100')
      await mesonClientForProvider.depositAndRegister(token.address, '100', '1')
      await expect(mesonClientForInitiator.depositAndRegister(token.address, '100', '1'))
        .to.be.revertedWith('Index already registered')
    })
    it('rejects if provider is already registered', async () => {
      await token.approve(mesonInstance.address, '100')
      await mesonClientForProvider.depositAndRegister(token.address, '100', '1')
      await expect(mesonClientForProvider.depositAndRegister(token.address, '100', '2'))
        .to.be.revertedWith('Address already registered')
    })
  })

  describe('#deposit', () => {
    it('rejects if not registered', async () => {
      await expect(mesonClientForProvider.deposit(token.address, '0'))
        .to.be.rejectedWith('not registered. Please call depositAndRegister first.')
    })
    it('rejects zero amount', async () => {
      await token.approve(mesonInstance.address, '100')
      await mesonClientForProvider.depositAndRegister(token.address, '100', '1')
      await expect(mesonClientForProvider.deposit(token.address, '0'))
        .to.be.revertedWith('Amount must be positive')
    })
    it('rejects if token not supported', async () => {
      await token.approve(mesonInstance.address, '100')
      await mesonClientForProvider.depositAndRegister(token.address, '100', '1')

      await expect(mesonClientForProvider.deposit(TestAddress, '100'))
        .to.be.rejectedWith('Token not supported')

      const balanceIndex = pack(['uint8', 'uint40'], [2, 1])
      await expect(mesonInstance.deposit(100, balanceIndex))
        .to.be.revertedWith('function call to a non-contract account')
    })
    it('rejects if not approved', async () => {
      await token.approve(mesonInstance.address, '199')
      await mesonClientForProvider.depositAndRegister(token.address, '100', '1')
      await expect(mesonClientForProvider.deposit(token.address, '100'))
        .to.be.revertedWith('ERC20: transfer amount exceeds allowance')
    })
    it('accepts a valid deposit', async () => {
      await token.approve(mesonInstance.address, '200')
      await mesonClientForProvider.depositAndRegister(token.address, '100', '1')
      await mesonClientForProvider.deposit(token.address, '100')
      expect(await mesonInstance.balanceOf(token.address, provider.address)).to.equal('200')
    })
  })

  describe('#withdraw', () => {
    it('rejects if not registered', async () => {
      await expect(mesonInstance.withdraw(100, 1))
        .to.be.revertedWith('Caller not registered. Call depositAndRegister')
    })
    it('rejects if overdrawn', async () => {
      await token.approve(mesonInstance.address, '100')
      await mesonClientForProvider.depositAndRegister(token.address, '100', '1')

      await expect(mesonInstance.withdraw(101, 1))
        .to.be.revertedWith('reverted with panic code 0x11')
    })
    it('accepts a valid withdraw', async () => {
      await token.approve(mesonInstance.address, '100')
      await mesonClientForProvider.depositAndRegister(token.address, '100', '1')

      await mesonInstance.withdraw(50, 1)
      expect(await mesonInstance.balanceOf(token.address, provider.address)).to.equal('50')
    })
  })

  describe('#lock', async () => {
    // it('rejects lock  already exists', async () => {
    //   await mesonContract.depositAndRegister(amount, balanceIndex)
    //   await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
    //   try {
    //     await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
    //   } catch (error) {
    //     expect(error).to.throw
    //   }
    // })
    // it('rejects caller not registered', async () => {
    //   try {
    //     await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
    //   } catch (error) {
    //     expect(error).to.throw
    //   }
    // })
    // it('accepts the withdraw if all parameters are correct', async () => {
    //   await mesonContract.depositAndRegister(amount, balanceIndex)
    //   await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
    //   const getLockedSwap = await mesonContract.getLockedSwap(signedRequest.encoded)
    //   expect(signedRequest.initiator).to.equal(getLockedSwap.initiator.toLowerCase())
    // })
    it('lockes a swap', async () => {
      await token.approve(mesonInstance.address, 200)
      await mesonClientForProvider.depositAndRegister(token.address, '200', '1')

      const swap = mesonClientForInitiator.requestSwap(getPartialSwap({ amount: '100' }), outChain)
      const signedRequestData = await swap.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)
      signedRequest.checkSignature(true)

      await mesonClientForProvider.lock(signedRequest)
      expect(await mesonInstance.balanceOf(mesonClientForProvider.token(1), provider.address)).to.equal(100)
      const locked = await mesonClientForInitiator.getLockedSwap(swap.encoded)
      expect(locked.status).to.equal(LockedSwapStatus.Locked)
      expect(locked.initiator).to.equal(initiator.address)
      expect(locked.provider).to.equal(provider.address)
    })
  })

  describe('#unlock', async () => {
    let balanceIndex = 0x010000000001
    let amount = 100
    // it('rejects swap  does not exist', async () => {
    //   await mesonContract.depositAndRegister(amount, balanceIndex)
    //   await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
    //   try {
    //     await mesonContract.unlock(signedRequest.encoded + '01')
    //   } catch (error) {
    //     expect(error).to.throw
    //   }
    // })
    // it('rejects swap still in lock', async () => {
    //   await mesonContract.depositAndRegister(amount, balanceIndex)
    //   await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
    //   try {
    //     await mesonContract.unlock(signedRequest.encoded)
    //   } catch (error) {
    //     expect(error).to.throw
    //   }
    // })
    // it('rejects Swap not for this chain ', async () => {
    //   try {
    //     await mesonContract.depositAndRegister(amount, balanceIndex)
    //     await mesonContract.lock(signedRequest.encoded + '0', ...signedRequest.signature, signedRequest.initiator)
    //   } catch (error) {
    //     expect(error).to.throw
    //   }
    // })
    it('accepts the unlock if all parameters are correct', async () => {
      //How to test ？The time requirement is 30 minutes later
    })
  })

  describe('#release', async () => {
    // let balanceIndex = 0x010000000001
    // let amount = 100
    // it('rejects swap does not exist ', async () => {
    //   await mesonContract.depositAndRegister(amount, balanceIndex)
    //   await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
    //   const release = await swap.signForRelease(swapData.recipient)
    //   const signedRelease = new SignedSwapRelease(release)
    //   try {
    //     await mesonContract.release(signedRelease.encoded + '0', ...signedRelease.signature, signedRelease.recipient)
    //   } catch (error) {
    //     expect(error).to.throw
    //   }
    // })
    // it('accepts the release if all parameters are correct ', async () => {
    //   await mesonContract.depositAndRegister(amount, balanceIndex)
    //   await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
    //   const release = await swap.signForRelease(swapData.recipient, testnetMode)
    //   const signedRelease = new SignedSwapRelease(release)
    //   signedRelease.checkSignature(testnetMode)
    //   await mesonContract.release(signedRelease.encoded, ...signedRelease.signature, signedRelease.recipient)
    //   expect(await tokenContract.balanceOf(swapData.recipient)).to.equal(amount);
    //   expect(await tokenContract.balanceOf(mesonContract.address)).to.equal(0);
    // })

    it('accepts a release', async () => {
      await token.approve(mesonInstance.address, 200)
      await mesonClientForProvider.depositAndRegister(token.address, '200', '1')

      const swap = mesonClientForInitiator.requestSwap(getPartialSwap({ amount: '100' }), outChain)
      const signedRequestData = await swap.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)
      signedRequest.checkSignature(true)

      await mesonClientForProvider.lock(signedRequest)

      const signedReleaseData = await swap.signForRelease(TestAddress, true)
      const signedRelease = new SignedSwapRelease(signedReleaseData)
      signedRelease.checkSignature(true)

      await mesonClientForProvider.release(signedRelease)

      expect(await token.balanceOf(TestAddress)).to.equal(100)
      const locked = await mesonClientForInitiator.getLockedSwap(swap.encoded)
      expect(locked.status).to.equal(LockedSwapStatus.NoneOrAfterRunning)
      expect(locked.initiator).to.be.undefined
      expect(locked.provider).to.be.undefined
    })
  })

  describe('#getLockSwap', async () => {
    // it('rejects Swap not for this chain', async () => {
    //   let balanceIndex = 0x010000000001
    //   let amount = 100
    //   try {
    //     await mesonContract.depositAndRegister(amount, balanceIndex)
    //     await mesonContract.lock(signedRequest.encoded + '0', ...signedRequest.signature, signedRequest.initiator)
    //   } catch (error) {
    //     expect(error).to.throw
    //   }
    // })
    // it('accepts the getLockSwap if all parameters are correct ', async () => {
    //   let balanceIndex = 0x010000000001
    //   let amount = 100
    //   await mesonContract.depositAndRegister(amount, balanceIndex)
    //   await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
    //   const getLockedSwap = await mesonContract.getLockedSwap(signedRequest.encoded)
    //   expect(signedRequest.initiator).to.equal(getLockedSwap.initiator.toLowerCase())
    // })
  })
})
