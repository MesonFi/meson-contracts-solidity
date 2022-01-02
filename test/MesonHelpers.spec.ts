import { ethers, waffle } from 'hardhat'
import { MesonClient, SwapRequestWithSigner } from '@meson/sdk'
import { MesonHelpersTest } from '@meson/contract-types'

import { expect } from './shared/expect'
import { wallet } from './shared/wallet'
import { getDefaultSwap } from './shared/meson'

describe('MesonHelpers', () => {
  let mesonInstance: MesonHelpersTest
  let mesonClient: MesonClient
  let swap: SwapRequestWithSigner

  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonHelpersTest')
    return (await factory.deploy()) as MesonHelpersTest
  }

  beforeEach('deploy MesonHelpersTest', async () => {
    mesonInstance = await waffle.loadFixture(fixture)
    const outChain = await mesonInstance.getCoinType()
    mesonClient = await MesonClient.Create(mesonInstance)
    swap = mesonClient.requestSwap(outChain, getDefaultSwap())
  })

  describe('#encodeSwap', () => {
    it('returns same result as js function', async () => {
      const encodedSwapFromContract = await mesonInstance.encodeSwap(
        swap.expireTs,
        swap.inToken,
        swap.amount,
        swap.outChain,
        swap.outToken,
        swap.recipient
      )

      expect(encodedSwapFromContract).to.equal(swap.encode())
    })
  })

  describe('#getSwapId', () => {
    it('returns same result as js function', async () => {
      const swapIdFromContract = await mesonInstance.getSwapId(
        swap.expireTs,
        swap.inToken,
        swap.amount,
        swap.outChain,
        swap.outToken,
        swap.recipient
      )

      expect(swapIdFromContract).to.equal(swap.id())
    })
  })

  describe('#decodeSwapInput', () => {
    it('returns decoded swap data', async () => {
      const decoded = await mesonInstance.decodeSwapInput(swap.encode())
      expect(decoded[0]).to.equal(swap.expireTs)
      expect(decoded[1].toLowerCase()).to.equal(ethers.utils.keccak256(swap.inToken))
      expect(decoded[2]).to.equal(swap.amount)
    })
  })

  describe('#checkRequestSignature', () => {
    it('validates a request signature', async () => {
      const sigs = await swap.signRequest(wallet)
      await mesonInstance.checkRequestSignature(swap.id(), wallet.address, ...sigs)
    })
  })

  describe('#checkReleaseSignature', () => {
    it('validates a release signature', async () => {
      const sigs = await swap.signRelease(wallet)
      await mesonInstance.checkReleaseSignature(swap.id(), wallet.address, ...sigs)
    })
  })
})
