import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { wallet } from './shared/wallet'
import { SwapRequest, SwapSigner } from '../libs'
import { MesonHelpersTest } from '../typechain/MesonHelpersTest'

describe('MesonHelpers', () => {
  let contract: MesonHelpersTest
  let outChain: string
  let swap: SwapRequest
  let swapSigner: SwapSigner
  let encodedSwap: string
  let swapId: string

  const expireTs = Date.now()
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
    swap = new SwapRequest({ expireTs, inToken, amount, outChain, outToken, recipient })
    swapSigner = new SwapSigner(contract.address, 3 /* chainId */)
    encodedSwap = swap.encode()
    swapId = swap.getSwapId()
  })

  describe('#encodeSwap', () => {
    it('returns same result as js function', async () => {
      const encodedSwapFromContract = await contract.encodeSwap(
        expireTs,
        inToken,
        amount,
        outChain,
        outToken,
        recipient
      )

      expect(encodedSwapFromContract).to.equal(encodedSwap)
    })
  })

  describe('#getSwapId', () => {
    it('returns same result as js function', async () => {
      const swapIdFromContract = await contract.getSwapId(
        expireTs,
        inToken,
        amount,
        outChain,
        outToken,
        recipient
      )

      expect(swapIdFromContract).to.equal(swapId)
    })
  })

  describe('#decodeSwap', () => {
    it('returns decoded swap data', async () => {
      const decoded = await contract.decodeSwap(encodedSwap)
      expect(decoded[0]).to.equal(expireTs)
      expect(decoded[1].toLowerCase()).to.equal(ethers.utils.keccak256(inToken))
      expect(decoded[2]).to.equal(amount)
    })
  })

  describe('#checkRequestSignature', () => {
    it('validates a request signature', async () => {
      const { r, s, v } = await swapSigner.signSwapRequest(swap, wallet)
      await contract.checkRequestSignature(swapId, wallet.address, r, s, v)
    })
  })

  describe('#checkReleaseSignature', () => {
    it('validates a release signature', async () => {
      const { r, s, v } = await swapSigner.signSwapRelease(swapId, wallet)
      await contract.checkReleaseSignature(swapId, wallet.address, r, s, v)
    })
  })
})
