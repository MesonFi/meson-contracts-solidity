import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { MesonPricingTest } from '../typechain/MesonPricingTest'

const token = '0x243f22fbd4c375581aaacfcfff5a43793eb8a74d'
const addr = '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211'

describe('List', () => {
  let mesonPricing: MesonPricingTest
  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonPricingTest');
    const contract = (await factory.deploy(token)) as MesonPricingTest;
    await contract.addSupportedToken(token);
    return contract;
  }

  beforeEach('deploy MesonPricingTest', async () => {
    mesonPricing = await waffle.loadFixture(fixture)
  })

  describe('#totalSupplyFor', () => {
    it('is zero', async () => {
      expect(await mesonPricing.totalSupplyFor(token)).to.equal(0);
    })
  })

  describe('#totalDemandFor', () => {
    it('is zero', async () => {
      expect(await mesonPricing.totalDemandFor(token)).to.equal(0);
    })
  })

  describe('#increase', () => {
    it('increase supply by 100 and by 200', async () => {
      await mesonPricing.increase(token, 100)
      await mesonPricing.increase(token, 200)
      expect(await mesonPricing.totalSupplyFor(token)).to.equal(300);
    })

    it('increase supply by 100 and decrease by 50', async () => {
      await mesonPricing.increase(token, 100)
      await mesonPricing.decrease(token, 50)
      expect(await mesonPricing.totalSupplyFor(token)).to.equal(50);
    })

    it('increase supply by 100 and decrease by 200', async () => {
      await mesonPricing.increase(token, 100)
      await expect(mesonPricing.decrease(token, 200)).to.be.revertedWith('overdrawn')
    })
  })
})
