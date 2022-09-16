import { ethers, waffle } from 'hardhat'
import { EthersWalletSwapSigner, SwapWithSigner } from '@mesonfi/sdk'
import { MesonStatesTest } from '@mesonfi/contract-types'
import { pack } from '@ethersproject/solidity'
import { AddressZero } from '@ethersproject/constants'

import { expect } from './shared/expect'
import { initiator } from './shared/wallet'
import { getSwap, TestAddress, TestAddress2 } from './shared/meson'

describe('MesonStates', () => {
  const testnetMode = true
  
  let mesonInstance: MesonStatesTest
  let swap: SwapWithSigner

  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonStatesTest')
    return (await factory.deploy()) as MesonStatesTest
  }

  beforeEach('deploy MesonStatesTest', async () => {
    mesonInstance = await waffle.loadFixture(fixture)
    const swapSigner = new EthersWalletSwapSigner(initiator)
    swap = new SwapWithSigner(getSwap(), swapSigner)
  })

  describe('#addSupportToken', () => {
    it('rejects zero index', async () => {
      await expect(mesonInstance.addSupportToken(TestAddress, 0))
        .to.revertedWith('Cannot use 0 as token index')
    })
    it('rejects zero address', async () => {
      await expect(mesonInstance.addSupportToken(AddressZero, 1))
        .to.revertedWith('Cannot use zero address')
    })
    it('accepts non-zero index', async () => {
      await mesonInstance.addSupportToken(TestAddress, 1)
    })
    it('rejects existing token or index', async () => {
      await mesonInstance.addSupportToken(TestAddress, 1)

      await expect(mesonInstance.addSupportToken(TestAddress, 2))
        .to.revertedWith('Token has been added before')

      await expect(mesonInstance.addSupportToken(TestAddress2, 1))
        .to.revertedWith('Index has been used')
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

  describe('#getSupportedTokens', () => {
    it('returns the array of supported tokens', async () => {
      await mesonInstance.addSupportToken(TestAddress, 1)
      await mesonInstance.addSupportToken(TestAddress2, 255)
      const { tokens, indexes } = await mesonInstance.getSupportedTokens()
      expect(tokens).to.deep.equal([TestAddress, TestAddress2])
      expect(indexes).to.deep.equal([1, 255])
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
        swap.version,
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
      expect(decoded.version).to.equal(swap.version)
      expect(decoded.amount).to.equal(swap.amount)
      expect(decoded.serviceFee).to.equal(swap.amount.div(1000))
      expect(decoded.feeForLp).to.equal(swap.fee)
      expect(decoded.salt).to.equal(swap.salt)
      expect(decoded.expireTs).to.equal(swap.expireTs)
      expect(decoded.inChain).to.equal(swap.inChain)
      expect(decoded.inTokenIndex).to.equal(swap.inToken)
      expect(decoded.outChain).to.equal(swap.outChain)
      expect(decoded.outTokenIndex).to.equal(swap.outToken)
      expect(decoded.poolTokenIndexForOutToken).to.equal(pack(['uint8', 'uint40'], [swap.outToken, 1]))
    })
  })

  describe('#decodePostedSwap', () => {
    it('returns decoded posted swap data', async () => {
      const postedSwap = pack(['address', 'uint40'], [TestAddress, 1])
      const decodedPosted = await mesonInstance.decodePostedSwap(postedSwap)
      expect(decodedPosted.initiator).to.equal(TestAddress)
      expect(decodedPosted.poolIndex).to.equal(1)
    })
  })

  describe('#lockedSwapFrom', () => {
    it('returns same result as js function', async () => {
      const ts = Math.floor(Date.now() / 1000)
      const lockedSwap = pack(['uint40', 'uint40'], [ts, 1])
      expect(await mesonInstance.lockedSwapFrom(ts, 1)).to.equal(lockedSwap)
    })
  })

  describe('#decodeLockedSwap', () => {
    it('returns decoded locked swap data', async () => {
      const ts = Math.floor(Date.now() / 1000)
      const lockedSwap = pack(['uint40', 'uint40'], [ts, 1])
      const decodedLocked = await mesonInstance.decodeLockedSwap(lockedSwap)
      expect(decodedLocked.poolIndex).to.equal(1)
      expect(decodedLocked.until).to.equal(ts)
    })
  })

  describe('#poolTokenIndexFrom', () => {
    it('returns same result as js function', async () => {
      const poolTokenIndex = pack(['uint8', 'uint40'], [1, 2])
      expect(await mesonInstance.poolTokenIndexFrom(1, 2)).to.equal(poolTokenIndex)
    })
  })

  describe('#decodePoolTokenIndex', () => {
    it('returns decoded balance index data', async () => {
      const poolTokenIndex = pack(['uint8', 'uint40'], [1, 2])
      const decoded = await mesonInstance.decodePoolTokenIndex(poolTokenIndex)
      expect(decoded.tokenIndex).to.equal(1)
      expect(decoded.poolIndex).to.equal(2)
    })
  })

  describe('#checkRequestSignature', () => {
    it('rejects invalid signature', async () => {
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
    it('rejects invalid signature', async () => {
      const sigs = (await swap.signForRelease(TestAddress, testnetMode)).signature
      await expect(mesonInstance.checkReleaseSignature(swap.encoded, TestAddress, ...sigs, TestAddress))
        .to.revertedWith('Invalid signature')
    })
    it('accepts a valid signature', async () => {
      const sigs = (await swap.signForRelease(TestAddress, testnetMode)).signature
      await mesonInstance.checkReleaseSignature(swap.encoded, TestAddress, ...sigs, initiator.address)
    })
  })
})