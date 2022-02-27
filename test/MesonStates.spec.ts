import { ethers, waffle } from 'hardhat'
import {
  MesonClient,
  EthersWalletSwapSigner,
  PartialSwapData,
  SwapWithSigner,
} from '@mesonfi/sdk'
import { MesonStatesTest } from '@mesonfi/contract-types'
import { pack } from '@ethersproject/solidity'
import { AddressZero } from '@ethersproject/constants'

import { expect } from './shared/expect'
import { initiator } from './shared/wallet'
import { getDefaultSwap } from './shared/meson'

describe('MesonStates', () => {
  const testnetMode = true
  const TestAddress = '0x7F342A0D04B951e8600dA1eAdD46afe614DaC20B'
  let mesonInstance: MesonStatesTest
  let swapData: PartialSwapData
  let swap: SwapWithSigner

  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonStatesTest')
    return (await factory.deploy()) as MesonStatesTest
  }

  beforeEach('deploy MesonStatesTest', async () => {
    mesonInstance = await waffle.loadFixture(fixture)
    const swapSigner = new EthersWalletSwapSigner(initiator)
    const mesonClient = await MesonClient.Create(mesonInstance as any, swapSigner)
    swapData = getDefaultSwap({ inToken: 2, outToken: 3, fee: '11' })
    swap = mesonClient.requestSwap(swapData, '0x1234')
  })

  describe('#addSupportToken', () => {
    it('rejects zero index', async () => {
      await expect(mesonInstance.addSupportToken(TestAddress, 0))
        .to.revertedWith('Cannot use 0 as token index')
    })
    it('accepts non-zero index', async () => {
      await mesonInstance.addSupportToken(TestAddress, 1)
    })
  })

  describe('#tokenForIndex', () => {
    it('returns the token address by index', async () => {
      await mesonInstance.addSupportToken(TestAddress, 1)
      expect(await mesonInstance.tokenForIndex(0)).to.equal(AddressZero)
      expect(await mesonInstance.tokenForIndex(1)).to.equal(TestAddress)
      expect(await mesonInstance.tokenForIndex(2)).to.equal(AddressZero)
    })
  })

  describe('#indexOfToken', () => {
    it('returns the token index by address', async () => {
      await mesonInstance.addSupportToken(TestAddress, 1)
      expect(await mesonInstance.indexOfToken(AddressZero)).to.equal(0)
      expect(await mesonInstance.indexOfToken(TestAddress)).to.equal(1)
    })
  })

  describe('#supportedTokens', () => {
    it('returns the array of supported tokens', async () => {
      await mesonInstance.addSupportToken(TestAddress, 1)
      await mesonInstance.addSupportToken(TestAddress, 2)
      expect(await mesonInstance.supportedTokens()).to.deep.equal([TestAddress, TestAddress])
    })
  })

  describe('#getShortCoinType', () => {
    it('returns the short coin type', async () => {
      expect(await mesonInstance.getShortCoinType()).to.equal('0x003c')
    })
  })

  describe('#encodeSwap', () => {
    it('returns same result as js function', async () => {
      const encodedSwapFromContract = await mesonInstance.encodeSwap(
        swap.amount,
        swap.salt,
        swap.fee,
        swap.expireTs,
        swap.outChain,
        swap.outToken,
        swap.inChain,
        swap.inToken
      )
      expect(encodedSwapFromContract).to.equal(swap.encoded)
    })
  })

  describe('#decodeSwap', () => {
    it('returns decoded swap data', async () => {
      const decoded = await mesonInstance.decodeSwap(swap.encoded, 1)
      expect(decoded.amount).to.equal(swap.amount)
      expect(decoded.fee).to.equal(swap.fee)
      expect(decoded.feeToMeson).to.equal(Math.floor(parseInt(swap.fee) / 2))
      expect(decoded.salt).to.equal(swap.salt)
      expect(decoded.expireTs).to.equal(swap.expireTs)
      expect(decoded.inChain).to.equal(swap.inChain)
      expect(decoded.inTokenIndex).to.equal(swap.inToken)
      expect(decoded.outChain).to.equal(swap.outChain)
      expect(decoded.outTokenIndex).to.equal(swap.outToken)
      expect(decoded.balanceIndexForMeson).to.equal(pack(['uint8', 'uint40'], [swap.inToken, 0]))
      expect(decoded.outTokenBalanceIndex).to.equal(pack(['uint8', 'uint40'], [swap.outToken, 1]))
    })
  })

  describe('#decodePostedSwap', () => {
    it('returns decoded posted swap data', async () => {
      const postedSwap = pack(['address', 'uint40'], [TestAddress, 1])
      const decodedPosted = await mesonInstance.decodePostedSwap(postedSwap)
      expect(decodedPosted.initiator).to.equal(TestAddress)
      expect(decodedPosted.providerIndex).to.equal(1)
    })
  })

  describe('#lockedSwapFrom', () => {
    it('returns same result as js function', async () => {
      const ts = Math.floor(Date.now() / 1000)
      const lockedSwap = pack(['uint40', 'uint40', 'address'], [ts, 1, TestAddress])
      expect(await mesonInstance.lockedSwapFrom(ts, 1, TestAddress)).to.equal(lockedSwap)
    })
  })

  describe('#decodeLockedSwap', () => {
    it('returns decoded locked swap data', async () => {
      const ts = Math.floor(Date.now() / 1000)
      const lockedSwap = pack(['uint40', 'uint40', 'address'], [ts, 1, TestAddress])
      const decodedLocked = await mesonInstance.decodeLockedSwap(lockedSwap)
      expect(decodedLocked.initiator).to.equal(TestAddress)
      expect(decodedLocked.providerIndex).to.equal(1)
      expect(decodedLocked.until).to.equal(ts)
    })
  })

  describe('#balanceIndexFrom', () => {
    it('returns same result as js function', async () => {
      const balanceIndex = pack(['uint8', 'uint40'], [1, 2])
      expect(await mesonInstance.balanceIndexFrom(1, 2)).to.equal(balanceIndex)
    })
  })

  describe('#decodeBalanceIndex', () => {
    it('returns decoded balance index data', async () => {
      const balanceIndex = pack(['uint8', 'uint40'], [1, 2])
      const decodedBalanceIndex = await mesonInstance.decodeBalanceIndex(balanceIndex)
      expect(decodedBalanceIndex.tokenIndex).to.equal(1)
      expect(decodedBalanceIndex.providerIndex).to.equal(2)
    })
  })

  describe('#checkRequestSignature', () => {
    it('rejects invalid signature"', async () => {
      const sigs = (await swap.signForRequest(testnetMode)).signature
      await expect(mesonInstance.checkRequestSignature(swap.encoded, ...sigs, TestAddress))
        .to.revertedWith('Invalid signature')
    })
    it('accepts a valid signature', async () => {
      const sigs = (await swap.signForRequest(testnetMode)).signature
      await mesonInstance.checkRequestSignature(swap.encoded, ...sigs, initiator.address)
    })
  })

  describe('#checkReleaseSignature', () => {
    it('accepts validates a release signature', async () => {
      const sigs = (await swap.signForRelease(swapData.recipient, testnetMode)).signature
      await expect(mesonInstance.checkReleaseSignature(swap.encoded, swapData.recipient, ...sigs, TestAddress))
        .to.revertedWith('Invalid signature')
    })
    it('Invalid signature', async () => {
      const sigs = (await swap.signForRelease(swapData.recipient, testnetMode)).signature
      await mesonInstance.checkReleaseSignature(swap.encoded, swapData.recipient, ...sigs, initiator.address)
    })
  })
})