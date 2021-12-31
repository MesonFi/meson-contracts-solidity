import { ethers, waffle } from 'hardhat'
import { MesonInterface, SwapRequest, SwapSigner } from '@meson/sdk'
import { MesonHelpersTest } from '@meson/contract-types/MesonHelpersTest'

import { expect } from './shared/expect'
import { wallet } from './shared/wallet'

describe('MesonHelpers', () => {
  let contract: MesonHelpersTest
  let outChain: string
  let meson: MesonInterface
  let swap: SwapRequest

  const inToken = '0x943f0cabc0675f3642927e25abfa9a7ae15e8672'
  const amount = 1
  const outToken = '0x2151166224670b37ec76c8ee2011bbbf4bbf2a52'
  const recipient = '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211'

  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonHelpersTest')
    return (await factory.deploy()) as MesonHelpersTest
  }

  beforeEach('deploy MesonHelpersTest', async () => {
    contract = await waffle.loadFixture(fixture)
    outChain = await contract.getCurrentChain()
    meson = new MesonInterface({ mesonAddress: contract.address, chainId: '0x3' })
    swap = meson.requestSwap(outChain, { inToken, amount, outToken, recipient })
  })

  describe('#encodeSwap', () => {
    it('returns same result as js function', async () => {
      const encodedSwapFromContract = await contract.encodeSwap(
        swap.expireTs,
        inToken,
        amount,
        outChain,
        outToken,
        recipient
      )

      expect(encodedSwapFromContract).to.equal(swap.encode())
    })
  })

  describe('#getSwapId', () => {
    it('returns same result as js function', async () => {
      const swapIdFromContract = await contract.getSwapId(
        swap.expireTs,
        inToken,
        amount,
        outChain,
        outToken,
        recipient
      )

      expect(swapIdFromContract).to.equal(swap.id())
    })
  })

  describe('#decodeSwap', () => {
    it('returns decoded swap data', async () => {
      const decoded = await contract.decodeSwap(swap.encode())
      expect(decoded[0]).to.equal(swap.expireTs)
      expect(decoded[1].toLowerCase()).to.equal(ethers.utils.keccak256(inToken))
      expect(decoded[2]).to.equal(amount)
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
