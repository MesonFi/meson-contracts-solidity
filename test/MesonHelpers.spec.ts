import { ethers, waffle } from 'hardhat'
import { MesonInterface, SwapRequest } from '@meson/sdk'
import { MesonHelpersTest } from '@meson/contract-types'

import { expect } from './shared/expect'
import { wallet } from './shared/wallet'
import { getDefaultSwap } from './shared/meson'

describe('MesonHelpers', () => {
  let contract: MesonHelpersTest
  let meson: MesonInterface
  let swap: SwapRequest

  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonHelpersTest')
    return (await factory.deploy()) as MesonHelpersTest
  }

  beforeEach('deploy MesonHelpersTest', async () => {
    contract = await waffle.loadFixture(fixture)
    const outChain = await contract.getCurrentChain()
    meson = new MesonInterface({ mesonAddress: contract.address, chainId: '0x3' })
    swap = meson.requestSwap(outChain, getDefaultSwap())
  })

  describe('#encodeSwap', () => {
    it('returns same result as js function', async () => {
      const encodedSwapFromContract = await contract.encodeSwap(
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
      const swapIdFromContract = await contract.getSwapId(
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
      const decoded = await contract.decodeSwapInput(swap.encode())
      expect(decoded[0]).to.equal(swap.expireTs)
      expect(decoded[1].toLowerCase()).to.equal(ethers.utils.keccak256(swap.inToken))
      expect(decoded[2]).to.equal(swap.amount)
    })
  })

  describe('#checkRequestSignature', () => {
    it('validates a request signature', async () => {
      const { r, s, v } = await meson.signer.signSwapRequest(swap, wallet)
      await contract.checkRequestSignature(swap.id(), wallet.address, r, s, v)
    })
  })

  describe('#checkReleaseSignature', () => {
    it('validates a release signature', async () => {
      const { r, s, v } = await meson.signer.signSwapRelease(swap.id(), wallet)
      await contract.checkReleaseSignature(swap.id(), wallet.address, r, s, v)
    })
  })
})
