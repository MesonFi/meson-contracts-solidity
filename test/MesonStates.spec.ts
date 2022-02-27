import { ethers, waffle } from 'hardhat'
import {
  MesonClient,
  Swap,
  EthersWalletSwapSigner,
  PartialSwapData,
  SwapWithSigner,
} from '@mesonfi/sdk'
import { MesonStatesTest } from '@mesonfi/contract-types'
import { AddressZero } from '@ethersproject/constants'

import { expect } from './shared/expect'
import { initiator } from './shared/wallet'
import { getDefaultSwap } from './shared/meson'

describe('MesonSwap', () => {
  const testnetMode = true
  const OtherAddress = '0x7F342A0D04B951e8600dA1eAdD46afe614DaC20B'
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
    swapData = getDefaultSwap({ inToken: 2, outToken: 3 })
    swap = mesonClient.requestSwap(swapData, '0x1234')
  })

  describe('#addSupportToken', () => {
    it('rejects zero index', async () => {
      await expect(mesonInstance.addSupportToken(OtherAddress, 0))
        .to.revertedWith('Cannot use 0 as token index')
    })
    it('accepts non-zero index', async () => {
      await mesonInstance.addSupportToken(OtherAddress, 1)
    })
  })

  describe('#tokenForIndex', () => {
    it('returns the token address by index', async () => {
      await mesonInstance.addSupportToken(OtherAddress, 1)
      expect(await mesonInstance.tokenForIndex(0)).to.equal(AddressZero)
      expect(await mesonInstance.tokenForIndex(1)).to.equal(OtherAddress)
      expect(await mesonInstance.tokenForIndex(2)).to.equal(AddressZero)
    })
  })

  describe('#indexOfToken', () => {
    it('returns the token index by address', async () => {
      await mesonInstance.addSupportToken(OtherAddress, 1)
      expect(await mesonInstance.indexOfToken(AddressZero)).to.equal(0)
      expect(await mesonInstance.indexOfToken(OtherAddress)).to.equal(1)
    })
  })

  describe('#supportedTokens', () => {
    it('returns the array of supported tokens', async () => {
      await mesonInstance.addSupportToken(OtherAddress, 1)
      await mesonInstance.addSupportToken(OtherAddress, 2)
      expect(await mesonInstance.supportedTokens()).to.deep.equal([OtherAddress, OtherAddress])
    })
  })

  describe('#getShortCoinType', () => {
    it('returns the short coin type', async () => {
      expect(await mesonInstance.getShortCoinType()).to.equal('0x003c')
    })
  })

  describe('#encodeSwap', () => {
    it('', async () => {
    })
  })

  describe('#decodeSwap', () => {
    it('', async () => {
    })
  })

  describe('#decodePostedSwap', () => {
    it('', async () => {
    })
  })

  describe('#lockedSwapFrom', () => {
    it('', async () => {
    })
  })

  describe('#decodeLockedSwap', () => {
    it('', async () => {
    })
  })

  describe('#balanceIndexFrom', () => {
    it('', async () => {
    })
  })

  describe('#decodeBalanceIndex', () => {
    it('', async () => {
    })
  })

  describe('#checkRequestSignature', () => {

    it('rejects invalid signature"', async () => {
      const sigs = (await swap.signForRequest(testnetMode)).signature
      await expect(mesonInstance.checkRequestSignature(swap.encoded, ...sigs, OtherAddress))
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
      await expect(mesonInstance.checkReleaseSignature(swap.encoded, swapData.recipient, ...sigs, OtherAddress))
        .to.revertedWith('Invalid signature')
    })
    it('Invalid signature', async () => {
      const sigs = (await swap.signForRelease(swapData.recipient, testnetMode)).signature
      await mesonInstance.checkReleaseSignature(swap.encoded, swapData.recipient, ...sigs, initiator.address)
    })
  })
})