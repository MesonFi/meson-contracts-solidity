import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { Swap, getSwapId, getSwapHash } from './shared/wallet'
import { MesonPricingTest } from '../typechain/MesonPricingTest'

const token = '0x243f22fbd4c375581aaacfcfff5a43793eb8a74d'

describe('MesonPricing', () => {
  let contract: MesonPricingTest
  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonPricingTest')
    return (await factory.deploy(token)) as MesonPricingTest
  }

  beforeEach('deploy MesonPricingTest', async () => {
    contract = await waffle.loadFixture(fixture)
  })

  describe('#totalSupplyFor', () => {
    it('is zero', async () => {
      expect(await contract.totalSupplyFor(token)).to.equal(0);
    })
  })

  describe('#totalDemandFor', () => {
    it('is zero', async () => {
      expect(await contract.totalDemandFor(token)).to.equal(0);
    })
  })

  describe('#increase', () => {
    it('increase supply by 100 and by 200', async () => {
      await contract.increaseSupply(token, 100)
      await contract.increaseSupply(token, 200)
      expect(await contract.totalSupplyFor(token)).to.equal(300);
    })

    it('increase supply by 100 and decrease by 50', async () => {
      await contract.increaseSupply(token, 100)
      await contract.decreaseSupply(token, 50)
      expect(await contract.totalSupplyFor(token)).to.equal(50);
    })

    it('increase supply by 100 and decrease by 200', async () => {
      await contract.increaseSupply(token, 100)
      await expect(contract.decreaseSupply(token, 200)).to.be.revertedWith('overdrawn')
    })
  })

  const chain = '0x8000003c' // for ETH by SLIP-44
  const inToken = '0x943f0cabc0675f3642927e25abfa9a7ae15e8672'
  const outToken = '0x2151166224670b37ec76c8ee2011bbbf4bbf2a52'
  const receiver = '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211'
  const amount = 1
  const swap: Swap = { inToken, outToken, chain, receiver, amount }

  describe('#getSwapId', () => {
    it('returns same result as getSwapIdAsProvider and the js function', async () => {
      const swapId = getSwapId(swap)
      const swapIdAsUser = await contract.getSwapId(
        amount,
        inToken,
        chain,
        outToken,
        receiver
      );
      const swapIdAsProvider = await contract.getSwapIdAsProvider(
        amount,
        inToken,
        outToken,
        receiver
      );
      expect(swapId).to.equal(swapIdAsUser)
      expect(swapId).to.equal(swapIdAsProvider)
    })
  })

  describe('#getSwapHash', () => {
    it('returns same result as the js function', async () => {
      const swapId = getSwapId(swap)
      const epoch = 10
      const swapHash = getSwapHash(swapId, epoch)

      const swapHashAsProvider = await contract.getSwapHash(swapId, epoch)
      expect(swapHash).to.equal(swapHashAsProvider)
    })
  })
})
