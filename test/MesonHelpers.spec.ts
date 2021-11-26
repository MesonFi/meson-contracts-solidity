import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { wallet } from './shared/wallet'
import { Swap, getSwapId, getSwapHash, signSwap } from '../libs/meson_helpers'
import { MesonHelpersTest } from '../typechain/MesonHelpersTest'

describe('MesonHelpers', () => {
  let contract: MesonHelpersTest

  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonHelpersTest')
    return (await factory.deploy()) as MesonHelpersTest
  }

  beforeEach('deploy MesonHelpersTest', async () => {
    contract = await waffle.loadFixture(fixture)
  })

  const outChain = '0x8000003c' // for ETH by SLIP-44
  const inToken = '0x943f0cabc0675f3642927e25abfa9a7ae15e8672'
  const outToken = '0x2151166224670b37ec76c8ee2011bbbf4bbf2a52'
  const receiver = '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211'
  const amount = 1
  const ts = Date.now()
  const swap: Swap = { inToken, outToken, outChain, receiver, amount, ts }
  const swapId = getSwapId(swap)

  describe('#getSwapId', () => {
    it('returns same result as getSwapIdAsProvider and the js function', async () => {
      const swapIdAsUser = await contract.getSwapId(
        amount,
        inToken,
        outChain,
        outToken,
        receiver,
        ts
      )
      const swapIdAsProvider = await contract.getSwapIdAsProvider(
        amount,
        inToken,
        outToken,
        receiver,
        ts
      )
      expect(swapId).to.equal(swapIdAsUser)
      expect(swapId).to.equal(swapIdAsProvider)
    })
  })

  describe('#getSwapHash', () => {
    it('returns same result as the js function', async () => {
      const epoch = 10
      const swapHash = getSwapHash(swapId, epoch)

      const swapHashAsProvider = await contract.getSwapHash(swapId, epoch)
      expect(swapHash).to.equal(swapHashAsProvider)
    })
  })

  describe('#checkSignature', () => {
    it('checkSignature could check signer from message and signature', async () => {
      const swapId = getSwapId(swap);
      const epoch = 10;
      const swapHash = getSwapHash(swapId, epoch);
      const signature = signSwap(wallet, swapId, epoch);

      await contract.checkSignature(signature, swapHash, wallet.address);
    })
  })
})
