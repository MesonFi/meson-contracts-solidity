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
import { initiator, poolOwner } from './shared/wallet'
import { fixtures, TOKEN_BALANCE, TOKEN_TOTAL_SUPPLY } from './shared/fixtures'
import { getPartialSwap, TestAddress } from './shared/meson'

describe('MesonPools', () => {
  let token: MockToken
  let outChain: string

  let mesonInstance: MesonPoolsTest
  let mesonClientForInitiator: MesonClient
  let mesonClientForPoolOwner: MesonClient

  let swap: SwapWithSigner
  let signedRequest: SignedSwapRequest
  let signedRelease: SignedSwapRelease

  beforeEach('deploy MesonPoolsTest', async () => {
    const result = await waffle.loadFixture(() => fixtures([
      initiator.address, poolOwner.address
    ]))
    token = result.token1.connect(poolOwner)
    mesonInstance = result.pools.connect(poolOwner) // pool owner is signer

    const swapSigner = new EthersWalletSwapSigner(initiator)
    mesonClientForInitiator = await MesonClient.Create(result.pools as any, swapSigner)
    mesonClientForPoolOwner = await MesonClient.Create((mesonInstance as any).connect(poolOwner))
    outChain = mesonClientForPoolOwner.shortCoinType

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
      expect(await token.balanceOf(poolOwner.address)).to.equal(TOKEN_BALANCE)
      expect(await token.balanceOf(mesonInstance.address)).to.equal(0)
    })
  })

  describe('#depositAndRegister', () => {
      const amount = ethers.utils.parseUnits('1000', 6)
      it('rejects zero pool index', async () => {
      await expect(mesonClientForPoolOwner.depositAndRegister(token.address, amount, '0'))
        .to.be.revertedWith('Cannot use 0 as pool index')
    })
    it('rejects zero amount', async () => {
      await expect(mesonClientForPoolOwner.depositAndRegister(token.address, '0', '1'))
        .to.be.revertedWith('Amount must be positive')
    })
    it('rejects if token not supported', async () => {
      await expect(mesonClientForPoolOwner.depositAndRegister(TestAddress, amount, '1'))
        .to.be.rejectedWith('Token not supported')

      const poolTokenIndex = pack(['uint8', 'uint40'], [2, 1])
      await expect(mesonInstance.depositAndRegister(1000, poolTokenIndex))
        .to.be.revertedWith('Token not supported')
    })
    it('rejects if not approved', async () => {
      await token.approve(mesonInstance.address, ethers.utils.parseUnits('999', 6))
      await expect(mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1'))
        .to.be.revertedWith('transferFrom failed')
    })
    it('accepts a valid depositAndRegister', async () => {
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')
      expect(await mesonInstance.poolTokenBalance(token.address, poolOwner.address)).to.equal(amount)
    })
    it('rejects if index is already registered', async () => {
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')
      await expect(mesonClientForInitiator.depositAndRegister(token.address, amount, '1'))
        .to.be.revertedWith('Pool index already registered')
    })
    it('rejects if provider is already registered', async () => {
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')
      await expect(mesonClientForPoolOwner.depositAndRegister(token.address, amount, '2'))
        .to.be.revertedWith('Signer address already registered')
    })
  })

  describe('#deposit', () => {
    const amount = ethers.utils.parseUnits('1000', 6)
    it('rejects if not registered', async () => {
      await expect(mesonClientForPoolOwner.deposit(token.address, '0'))
        .to.be.rejectedWith('not registered. Please call depositAndRegister first.')
    })
    it('rejects zero amount', async () => {
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')
      await expect(mesonClientForPoolOwner.deposit(token.address, '0'))
        .to.be.revertedWith('Amount must be positive')
    })
    it('rejects if token not supported', async () => {
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')

      await expect(mesonClientForPoolOwner.deposit(TestAddress, amount))
        .to.be.rejectedWith('Token not supported')

      const poolTokenIndex = pack(['uint8', 'uint40'], [2, 1])
      await expect(mesonInstance.deposit(1000, poolTokenIndex))
        .to.be.revertedWith('Token not supported')
    })
    it('rejects if not approved', async () => {
      await token.approve(mesonInstance.address, ethers.utils.parseUnits('1999', 6))
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')
      await expect(mesonClientForPoolOwner.deposit(token.address, amount))
        .to.be.revertedWith('transferFrom failed')
    })
    it('accepts a valid deposit', async () => {
      const doubleAmount = ethers.utils.parseUnits('2000', 6)
      await token.approve(mesonInstance.address, doubleAmount)
      await mesonClientForPoolOwner.depositAndRegister(token.address,  amount, '1')
      await mesonClientForPoolOwner.deposit(token.address,  amount)
      expect(await mesonInstance.poolTokenBalance(token.address, poolOwner.address)).to.equal(doubleAmount)
    })
  })

  describe('#withdraw', () => {
    const amount = ethers.utils.parseUnits('1000', 6)
    it('rejects if pool not registered', async () => {
      const poolTokenIndex = pack(['uint8', 'uint40'], [1, 1])
      await expect(mesonInstance.withdraw(amount, poolTokenIndex))
        .to.be.revertedWith('Need the pool owner as the signer')
    })
    it('rejects if overdrawn', async () => {
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')

      const withdrawAmount = ethers.utils.parseUnits('1001', 6)
      const poolTokenIndex = pack(['uint8', 'uint40'], [1, 1])
      await expect(mesonInstance.withdraw(withdrawAmount, poolTokenIndex))
        .to.be.revertedWith('panic code 0x11')
    })
    it('accepts a valid withdraw', async () => {
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')

      const withdrawAmount = ethers.utils.parseUnits('1', 6)
      const poolTokenIndex = pack(['uint8', 'uint40'], [1, 1])
      await mesonInstance.withdraw(withdrawAmount, poolTokenIndex)
      expect(await mesonInstance.poolTokenBalance(token.address, poolOwner.address)).to.equal(amount.sub(withdrawAmount))
    })
  })

  describe('#lock', async () => {
    it('rejects if provider not registered', async () => {
      await expect(mesonClientForPoolOwner.lock(signedRequest))
        .to.be.revertedWith('Caller not registered. Call depositAndRegister.')
    })
    it('rejects if expireTs is soon', async () => {
      const amount = ethers.utils.parseUnits('1000', 6)
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')

      await ethers.provider.send('evm_increaseTime', [4200])
      await expect(mesonClientForPoolOwner.lock(signedRequest))
        .to.be.revertedWith('Cannot lock because expireTs is soon.')
      await ethers.provider.send('evm_increaseTime', [-4200])
    })
    it('rejects if deposit is not enough', async () => {
      const amount = ethers.utils.parseUnits('998', 6)
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')

      await expect(mesonClientForPoolOwner.lock(signedRequest))
        .to.be.revertedWith('panic code 0x11')
    })
    it('lockes a valid swap', async () => {
      const amount = ethers.utils.parseUnits('2000', 6)
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')

      await mesonClientForPoolOwner.lock(signedRequest)
      
      const poolBalance = amount.sub(swap.amount.sub(swap.fee))
      expect(await mesonInstance.poolTokenBalance(mesonClientForPoolOwner.token(1), poolOwner.address)).to.equal(poolBalance)
      const locked = await mesonClientForInitiator.getLockedSwap(swap.encoded, initiator.address)
      expect(locked.status).to.equal(LockedSwapStatus.Locked)
      expect(locked.poolOwner).to.equal(poolOwner.address)
    })
    it('rejects if swap already exists', async () => {
      const amount = ethers.utils.parseUnits('2000', 6)
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')

      await mesonClientForPoolOwner.lock(signedRequest)
      await expect(mesonClientForPoolOwner.lock(signedRequest)).to.be.revertedWith('Swap already exists')
    })
  })

  describe('#unlock', async () => {
    it('rejects if swap does not exist', async () => {
      await expect(mesonClientForPoolOwner.unlock(signedRequest)).to.be.revertedWith('Swap does not exist')
    })
    it('rejects if swap is still in lock', async () => {
      const amount = ethers.utils.parseUnits('2000', 6)
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')

      await mesonClientForPoolOwner.lock(signedRequest)

      await expect(mesonClientForPoolOwner.unlock(signedRequest)).to.be.revertedWith('Swap still in lock')
    })
    it('unlocks a valid swap', async () => {
      const amount = ethers.utils.parseUnits('2000', 6)
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')

      await mesonClientForPoolOwner.lock(signedRequest)
      await ethers.provider.send('evm_increaseTime', [3600])
      await mesonClientForPoolOwner.unlock(signedRequest)

      expect(await mesonInstance.poolTokenBalance(mesonClientForPoolOwner.token(1), poolOwner.address)).to.equal(amount)
      const locked = await mesonClientForInitiator.getLockedSwap(swap.encoded, initiator.address)
      expect(locked.status).to.equal(LockedSwapStatus.NoneOrAfterRunning)
      expect(locked.poolOwner).to.be.undefined

      await ethers.provider.send('evm_increaseTime', [-3600])
    })
  })

  describe('#release', async () => {
    it('rejects if swap does not exist', async () => {
      await expect(mesonClientForPoolOwner.release(signedRelease)).to.be.revertedWith('Swap does not exist')
    })
    it('releases a valid swap', async () => {
      const amount = ethers.utils.parseUnits('2000', 6)
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')

      await mesonClientForPoolOwner.lock(signedRequest)
      await mesonClientForPoolOwner.release(signedRelease)

      const releaseAmount = swap.amount.sub(swap.amount.div(1000)).sub(swap.fee)
      expect(await token.balanceOf(TestAddress)).to.equal(releaseAmount)
      const locked = await mesonClientForInitiator.getLockedSwap(swap.encoded, initiator.address)
      expect(locked.status).to.equal(LockedSwapStatus.NoneOrAfterRunning)
      expect(locked.poolOwner).to.be.undefined
    })
  })

  describe('#release for fee waived swap', async () => {
    it('reject fee waived swap for non-premium signer', async () => {
      const swap = mesonClientForInitiator.requestSwap({ ...getPartialSwap(), salt: '0xc0' }, outChain)
      const signedReleaseData = await swap.signForRelease(TestAddress, true)
      const signedRelease = new SignedSwapRelease(signedReleaseData)
      await expect(mesonClientForInitiator.release(signedRelease)).to.be.revertedWith('Caller is not the premium manager')
    })

    it('releases a fee waived swap', async () => {
      const swap = mesonClientForInitiator.requestSwap({ ...getPartialSwap(), salt: '0xc0' }, outChain)
      const signedRequestData = await swap.signForRequest(true)
      const signedRequest = new SignedSwapRequest(signedRequestData)
      const signedReleaseData = await swap.signForRelease(TestAddress, true)
      const signedRelease = new SignedSwapRelease(signedReleaseData)
      const amount = ethers.utils.parseUnits('2000', 6)

      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')

      await mesonClientForPoolOwner.lock(signedRequest)
      await mesonClientForPoolOwner.release(signedRelease)

      const releaseAmount = swap.amount.sub(swap.fee)
      expect(await token.balanceOf(TestAddress)).to.equal(releaseAmount)
      const locked = await mesonClientForInitiator.getLockedSwap(swap.encoded, initiator.address)
      expect(locked.status).to.equal(LockedSwapStatus.NoneOrAfterRunning)
      expect(locked.poolOwner).to.be.undefined
    })
  })

  describe('#getLockSwap', async () => {
    it('returns the locked swap', async () => {
      const amount = ethers.utils.parseUnits('2000', 6)
      await token.approve(mesonInstance.address, amount)
      await mesonClientForPoolOwner.depositAndRegister(token.address, amount, '1')
      await mesonClientForPoolOwner.lock(signedRequest)

      const locked = await mesonInstance.getLockedSwap(swap.encoded, initiator.address)
      expect(locked.poolOwner).to.equal(poolOwner.address)
    })
  })
})
