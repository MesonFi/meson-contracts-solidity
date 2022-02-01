import { ethers, waffle } from 'hardhat'
import { MesonClient, PartialSwapRequest, SwapRequestWithSigner } from '@mesonfi/sdk'
import mesonPresets from '@mesonfi/presets'
import { MesonStatesTest } from '@mesonfi/contract-types'

import { expect } from './shared/expect'
import { wallet } from './shared/wallet'
import { getDefaultSwap } from './shared/meson'

describe('MesonHelpers', () => {
  let mesonInstance: MesonStatesTest
  let mesonClient: MesonClient
  let swapData: PartialSwapRequest
  let swap: SwapRequestWithSigner

  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonStatesTest')
    return (await factory.deploy()) as MesonStatesTest
  }

  beforeEach('deploy MesonStatesTest', async () => {
    mesonInstance = await waffle.loadFixture(fixture)
    const outChain = await mesonInstance.getCoinType()
    mesonClient = await MesonClient.Create(mesonInstance as any)
    swapData = getDefaultSwap({ inToken: 2, outToken: 3 })
    swap = mesonClient.requestSwap(outChain, swapData)
  })

  describe('#encodeSwap', () => {
    it('returns same result as js function', async () => {
      const encodedSwapFromContract = await mesonInstance.encodeSwap(
        swap.amount,
        swap.fee,
        swap.expireTs,
        swap.outChain,
        swap.outToken,
        swap.inToken
      )

      expect(encodedSwapFromContract).to.equal(swap.encoded)
    })
  })

  describe('#decodeSwap (from mesonPresets)', () => {
    it('decodes a swap', async () => {
      const decoded = mesonPresets.decodeSwap(swap.encoded)

      expect(decoded.amount).to.equal(swap.amount)
      expect(decoded.fee).to.equal(swap.fee)
      expect(decoded.expireTs).to.equal(swap.expireTs)
      expect(decoded.inToken).to.equal(swap.inToken)
      expect(decoded.outToken).to.equal(swap.outToken)
      expect(decoded.outChain).to.equal(swap.outChain)
    })
  })

  describe('#decodeSwap', () => {
    it('returns decoded swap data', async () => {
      const decoded = await mesonInstance.decodeSwap(swap.encoded)
      expect(decoded[0]).to.equal(swap.amount)
      expect(decoded[1]).to.equal(swap.expireTs)
      expect(decoded[2]).to.equal(swap.inToken)
      expect(decoded[3]).to.equal(swap.outToken)
    })
  })

  describe('#checkRequestSignature', () => {
    it('validates a request signature', async () => {
      const sigs = await swap.signRequest(wallet)
      await mesonInstance.checkRequestSignature(swap.encoded, ...sigs, wallet.address)
    })
  })

  describe('#checkReleaseSignature', () => {
    it('validates a release signature', async () => {
      const sigs = await swap.signRelease(wallet, swapData.recipient)
      await mesonInstance.checkReleaseSignature(swap.encoded, swapData.recipient, ...sigs, wallet.address)
    })
  })
})
