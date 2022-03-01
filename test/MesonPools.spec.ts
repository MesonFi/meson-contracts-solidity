import { ethers, waffle } from 'hardhat'
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

import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE, TOKEN_TOTAL_SUPPLY } from './shared/fixtures'
import { getPartialSwap, TestAddress } from './shared/meson'

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
      await expect(mesonClientForProvider.depositAndRegister(token.address, '1000', '0'))
        .to.be.revertedWith('Cannot use 0 as provider index')
    })
    it('rejects zero amount', async () => {
      await expect(mesonClientForProvider.depositAndRegister(token.address, '0', '1'))
        .to.be.revertedWith('Amount must be positive')
    })
    it('rejects if token not supported', async () => {
      await expect(mesonClientForProvider.depositAndRegister(TestAddress, '1000', '1'))
        .to.be.rejectedWith('Token not supported')

      const balanceIndex = pack(['uint8', 'uint40'], [2, 1])
      await expect(mesonInstance.depositAndRegister(1000, balanceIndex))
        .to.be.revertedWith('function call to a non-contract account')
    })
    it('rejects if not approved', async () => {
      await token.approve(mesonInstance.address, '999')
      await expect(mesonClientForProvider.depositAndRegister(token.address, '1000', '1'))
        .to.be.revertedWith('ERC20: transfer amount exceeds allowance')
    })
    it('accepts a valid depositAndRegister', async () => {
      await token.approve(mesonInstance.address, '1000')
      await mesonClientForProvider.depositAndRegister(token.address, '1000', '1')
      expect(await mesonInstance.balanceOf(token.address, provider.address)).to.equal('1000')
    })
    it('rejects if index is already registered', async () => {
      await token.approve(mesonInstance.address, '1000')
      await mesonClientForProvider.depositAndRegister(token.address, '1000', '1')
      await expect(mesonClientForInitiator.depositAndRegister(token.address, '1000', '1'))
        .to.be.revertedWith('Index already registered')
    })
    it('rejects if provider is already registered', async () => {
      await token.approve(mesonInstance.address, '1000')
      await mesonClientForProvider.depositAndRegister(token.address, '1000', '1')
      await expect(mesonClientForProvider.depositAndRegister(token.address, '1000', '2'))
        .to.be.revertedWith('Address already registered')
    })
  })

  describe('#deposit', () => {
    it('rejects if not registered', async () => {
      await expect(mesonClientForProvider.deposit(token.address, '0'))
        .to.be.rejectedWith('not registered. Please call depositAndRegister first.')
    })
    it('rejects zero amount', async () => {
      await token.approve(mesonInstance.address, '1000')
      await mesonClientForProvider.depositAndRegister(token.address, '1000', '1')
      await expect(mesonClientForProvider.deposit(token.address, '0'))
        .to.be.revertedWith('Amount must be positive')
    })
    it('rejects if token not supported', async () => {
      await token.approve(mesonInstance.address, '1000')
      await mesonClientForProvider.depositAndRegister(token.address, '1000', '1')

      await expect(mesonClientForProvider.deposit(TestAddress, '1000'))
        .to.be.rejectedWith('Token not supported')

      const balanceIndex = pack(['uint8', 'uint40'], [2, 1])
      await expect(mesonInstance.deposit(1000, balanceIndex))
        .to.be.revertedWith('function call to a non-contract account')
    })
    it('rejects if not approved', async () => {
      await token.approve(mesonInstance.address, '1999')
      await mesonClientForProvider.depositAndRegister(token.address, '1000', '1')
      await expect(mesonClientForProvider.deposit(token.address, '1000'))
        .to.be.revertedWith('ERC20: transfer amount exceeds allowance')
    })
    it('accepts a valid deposit', async () => {
      await token.approve(mesonInstance.address, '2000')
      await mesonClientForProvider.depositAndRegister(token.address, '1000', '1')
      await mesonClientForProvider.deposit(token.address, '1000')
      expect(await mesonInstance.balanceOf(token.address, provider.address)).to.equal('2000')
    })
  })

  describe('#withdraw', () => {
    it('rejects if not registered', async () => {
      await expect(mesonInstance.withdraw(1000, 1))
        .to.be.revertedWith('Caller not registered. Call depositAndRegister')
    })
    it('rejects if overdrawn', async () => {
      await token.approve(mesonInstance.address, '1000')
      await mesonClientForProvider.depositAndRegister(token.address, '1000', '1')

      await expect(mesonInstance.withdraw(1001, 1))
        .to.be.revertedWith('reverted with panic code 0x11')
    })
    it('accepts a valid withdraw', async () => {
      await token.approve(mesonInstance.address, '1000')
      await mesonClientForProvider.depositAndRegister(token.address, '1000', '1')

      await mesonInstance.withdraw(500, 1)
      expect(await mesonInstance.balanceOf(token.address, provider.address)).to.equal('500')
    })
  })

  describe('#lock', async () => {
    it('rejects if provider not registered', async () => {
      await expect(mesonClientForProvider.lock(signedRequest))
        .to.be.revertedWith('Caller not registered. Call depositAndRegister.')
    })
    it('rejects if expireTs is soon', async () => {
      await token.approve(mesonInstance.address, 1000)
      await mesonClientForProvider.depositAndRegister(token.address, '1000', '1')

      await ethers.provider.send('evm_increaseTime', [4200])
      await expect(mesonClientForProvider.lock(signedRequest))
        .to.be.revertedWith('Cannot lock because expireTs is soon.')
      await ethers.provider.send('evm_increaseTime', [-4200])
    })
    it('rejects if deposit is not enough', async () => {
      await token.approve(mesonInstance.address, 999)
      await mesonClientForProvider.depositAndRegister(token.address, '999', '1')

      await expect(mesonClientForProvider.lock(signedRequest))
        .to.be.revertedWith('reverted with panic code 0x11')
    })
    it('lockes a valid swap', async () => {
      await token.approve(mesonInstance.address, 2000)
      await mesonClientForProvider.depositAndRegister(token.address, '2000', '1')

      await mesonClientForProvider.lock(signedRequest)
      
      expect(await mesonInstance.balanceOf(mesonClientForProvider.token(1), provider.address)).to.equal(1000)
      const locked = await mesonClientForInitiator.getLockedSwap(swap.encoded, initiator.address)
      expect(locked.status).to.equal(LockedSwapStatus.Locked)
      expect(locked.provider).to.equal(provider.address)
    })
    it('rejects if swap already exists', async () => {
      await token.approve(mesonInstance.address, 2000)
      await mesonClientForProvider.depositAndRegister(token.address, '2000', '1')

      await mesonClientForProvider.lock(signedRequest)
      await expect(mesonClientForProvider.lock(signedRequest)).to.be.revertedWith('Swap already exists')
    })
  })

  describe('#unlock', async () => {
    it('rejects if swap does not exist', async () => {
      await expect(mesonClientForProvider.unlock(signedRequest)).to.be.revertedWith('Swap does not exist')
    })
    it('rejects if swap is still in lock', async () => {
      await token.approve(mesonInstance.address, 2000)
      await mesonClientForProvider.depositAndRegister(token.address, '2000', '1')

      await mesonClientForProvider.lock(signedRequest)

      await expect(mesonClientForProvider.unlock(signedRequest)).to.be.revertedWith('Swap still in lock')
    })
    it('unlocks a valid swap', async () => {
      await token.approve(mesonInstance.address, 2000)
      await mesonClientForProvider.depositAndRegister(token.address, '2000', '1')

      await mesonClientForProvider.lock(signedRequest)
      await ethers.provider.send('evm_increaseTime', [1800])
      await mesonClientForProvider.unlock(signedRequest)

      expect(await mesonInstance.balanceOf(mesonClientForProvider.token(1), provider.address)).to.equal(2000)
      const locked = await mesonClientForInitiator.getLockedSwap(swap.encoded, initiator.address)
      expect(locked.status).to.equal(LockedSwapStatus.NoneOrAfterRunning)
      expect(locked.provider).to.be.undefined

      await ethers.provider.send('evm_increaseTime', [-1800])
    })
  })

  describe('#release', async () => {
    it('rejects if swap does not exist', async () => {
      await expect(mesonClientForProvider.release(signedRelease)).to.be.revertedWith('Swap does not exist')
    })
    it('releases a valid swap', async () => {
      await token.approve(mesonInstance.address, 2000)
      await mesonClientForProvider.depositAndRegister(token.address, '2000', '1')

      await mesonClientForProvider.lock(signedRequest)
      await mesonClientForProvider.release(signedRelease)

      expect(await token.balanceOf(TestAddress)).to.equal(1000)
      const locked = await mesonClientForInitiator.getLockedSwap(swap.encoded, initiator.address)
      expect(locked.status).to.equal(LockedSwapStatus.NoneOrAfterRunning)
      expect(locked.provider).to.be.undefined
    })
  })

  describe('#getLockSwap', async () => {
    it('returns the locked swap', async () => {
      await token.approve(mesonInstance.address, 2000)
      await mesonClientForProvider.depositAndRegister(token.address, '2000', '1')
      await mesonClientForProvider.lock(signedRequest)

      const locked = await mesonInstance.getLockedSwap(swap.encoded, initiator.address)
      expect(locked.provider).to.equal(provider.address)
    })
  })
})
