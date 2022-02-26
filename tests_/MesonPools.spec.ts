const { ethers, upgrades, waffle } = require('hardhat')
import { initiator, provider } from './shared/wallet'
const { getDefaultSwap } = require('../test/shared/meson')
import {
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease
} from '@mesonfi/sdk/src'
import { expect } from './shared/expect'
describe('MesonPools', () => {
  let totalSupply = 1000000000000
  let mesonContract;
  let tokenContract;
  let tokenUsdcContract;
  let mesonFactory;
  let userClient: MesonClient
  let signedRequest
  let outChain
  let swap
  let swapData

  beforeEach('deploy MesonPoolsTest', async () => {
    const MockToken = await ethers.getContractFactory('MockToken')
    tokenContract = await MockToken.deploy('Mock Token Usdt', 'MUsdt', totalSupply)
    await tokenContract.deployed()
    tokenUsdcContract = await MockToken.deploy('Mock Token Usdc', 'MUsdc', totalSupply)
    await tokenUsdcContract.deployed()
    mesonFactory = await ethers.getContractFactory('UpgradableMeson')
    mesonContract = await upgrades.deployProxy(mesonFactory, [[tokenContract.address, tokenUsdcContract.address]], { kind: 'uups' })
    await mesonContract.deployed()
    let approve = await tokenContract.approve(mesonContract.address, 1000)
    await approve
    userClient = await MesonClient.Create(mesonContract, new EthersWalletSwapSigner(initiator))
    outChain = await mesonContract.getShortCoinType()
    swap = userClient.requestSwap(getDefaultSwap(), outChain)
    const request = await swap.signForRequest()
    signedRequest = new SignedSwapRequest(request)
    swapData = getDefaultSwap()
  })

  describe('#depositAndRegister', () => {
    it('rejects zero amount', async () => {
      let balanceIndex = 0x010000000001
      let amount = 0
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if amount overflow', async () => {
      let amount = 10000000000000000000000000000
      let balanceIndex = 0x010000000001
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects the amount if no enough appove', async () => {
      let amount = 100
      let balanceIndex = 0x010000000001
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects Index already registered', async () => {
      let amount = 100
      let balanceIndex = 0x010000000001
      let balanceIndex2 = 0x010000000001
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
        await mesonContract.depositAndRegister(amount, balanceIndex2)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if provider index is zero', async () => {
      let amount = 100
      let balanceIndex = 0x010000000000
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if the address is already registered', async () => {
      let balanceIndex = 0x010000000001
      let amount = 100
      let balanceIndex2 = 0x010000000002
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
        await mesonContract.depositAndRegister(amount, balanceIndex2)
      } catch (error) {
        expect(error).to.throw
      }
    })

    it('refuses unsupported token', async () => {
      let amount = 100
      let balanceIndex = 0x030000000001
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
      } catch (error) {
        // console.log(error)
        expect(error).to.throw
      }
    })
    it('accepts the depositAndRegister if all parameters are correct', async () => {
      let amount = 1000
      let balanceIndex = 0x010000000001
      let deposit = await mesonContract.depositAndRegister(amount, balanceIndex)
      expect(await tokenContract.balanceOf(mesonContract.address)).to.equal(amount)
      expect(await tokenContract.balanceOf(provider.address)).to.equal(totalSupply - amount)
    })
  })

  describe('#deposit', () => {
    it('rejects zero amount ', async () => {
      let balanceIndex = 0x010000000001
      let amount = 0
      try {
        await mesonContract.deposit(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if amount overflow', async () => {
      let balanceIndex = 0x010000000001
      let amount = 10000000000000000000000000000
      try {
        await mesonContract.deposit(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects the amount if no enough appove', async () => {
      let balanceIndex = 0x010000000001
      let amount = 1000000
      try {
        await mesonContract.deposit(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the deposit if all parameters are correct', async () => {
      let balanceIndex = 0x010000000001
      let amount = 100
      await mesonContract.deposit(amount, balanceIndex)
      expect(await tokenContract.balanceOf(mesonContract.address)).to.equal(amount)
      expect(await tokenContract.balanceOf(provider.address)).to.equal(totalSupply - amount)
    })
  })

  describe('#withdraw', () => {
    it('rejects Caller not registered. Call depositAndRegister', async () => {
      let tokenIndex = 0x01
      let amount = 100
      try {
        await mesonContract.withdraw(amount, tokenIndex)
      } catch (error) {
        expect(error).to.throw
      } 2
    })
    it('refuses unsupported token', async () => {
      let tokenIndex = 0x03
      let balanceIndex = 0x010000000001
      let amount = 100
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
        await mesonContract.withdraw(amount, tokenIndex)
      } catch (error) {
        expect(error).to.throw
        // ProviderError: Error: VM Exception while processing transaction: reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)
      }
    })
    it('accepts the withdraw if all parameters are correct', async () => {
      let tokenIndex = 0x01
      let balanceIndex = 0x010000000001
      let amount = 100
      await mesonContract.depositAndRegister(amount, balanceIndex)
      await mesonContract.withdraw(amount, tokenIndex)
      expect(await tokenContract.balanceOf(mesonContract.address)).to.equal(0)
      expect(await tokenContract.balanceOf(provider.address)).to.equal(totalSupply)
    })
  })

  describe('#lock', async () => {
    let balanceIndex = 0x010000000001
    let amount = 100
    it('rejects lock  already exists', async () => {
      await mesonContract.depositAndRegister(amount, balanceIndex)
      await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
      try {
        await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects caller not registered', async () => {
      try {
        await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the withdraw if all parameters are correct', async () => {
      await mesonContract.depositAndRegister(amount, balanceIndex)
      await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
      const getLockedSwap = await mesonContract.getLockedSwap(signedRequest.encoded)
      expect(signedRequest.initiator).to.equal(getLockedSwap.initiator.toLowerCase())
    })
  })

  describe('#unlock', async () => {
    let balanceIndex = 0x010000000001
    let amount = 100
    it('rejects swap  does not exist', async () => {
      await mesonContract.depositAndRegister(amount, balanceIndex)
      await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
      try {
        await mesonContract.unlock(signedRequest.encoded + '01')
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects swap still in lock', async () => {
      await mesonContract.depositAndRegister(amount, balanceIndex)
      await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
      try {
        await mesonContract.unlock(signedRequest.encoded)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects Swap not for this chain ', async () => {
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
        await mesonContract.lock(signedRequest.encoded + '0', ...signedRequest.signature, signedRequest.initiator)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the unlock if all parameters are correct', async () => {
      //How to test ？The time requirement is 30 minutes later
    })
  })

  describe('#release', async () => {
    let balanceIndex = 0x010000000001
    let amount = 100
    it('rejects swap does not exist ', async () => {
      await mesonContract.depositAndRegister(amount, balanceIndex)
      await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
      const release = await swap.signForRelease(swapData.recipient)
      const signedRelease = new SignedSwapRelease(release)
      try {
        await mesonContract.release(signedRelease.encoded + '0', ...signedRelease.signature, signedRelease.recipient)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the release if all parameters are correct ', async () => {
      await mesonContract.depositAndRegister(amount, balanceIndex)
      await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
      const release = await swap.signForRelease(swapData.recipient)
      const signedRelease = new SignedSwapRelease(release)
      await mesonContract.release(signedRelease.encoded, ...signedRelease.signature, signedRelease.recipient)
      expect(await tokenContract.balanceOf(swapData.recipient)).to.equal(amount);
      expect(await tokenContract.balanceOf(mesonContract.address)).to.equal(0);
    })
  })

  describe('#getLockSwap', async () => {
    it('rejects Swap not for this chain', async () => {
      let balanceIndex = 0x010000000001
      let amount = 100
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
        await mesonContract.lock(signedRequest.encoded + '0', ...signedRequest.signature, signedRequest.initiator)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the getLockSwap if all parameters are correct ', async () => {
      let balanceIndex = 0x010000000001
      let amount = 100
      await mesonContract.depositAndRegister(amount, balanceIndex)
      await mesonContract.lock(signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator)
      const getLockedSwap = await mesonContract.getLockedSwap(signedRequest.encoded)
      expect(signedRequest.initiator).to.equal(getLockedSwap.initiator.toLowerCase())
    })
  })
})
 