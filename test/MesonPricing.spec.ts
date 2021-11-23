import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { wallet, signSwap, Swap, getSwapId } from './shared/wallet'
import { MesonPricingTest } from '../typechain/MesonPricingTest'
import { BigNumber } from '@ethersproject/bignumber'

const token = '0x243f22fbd4c375581aaacfcfff5a43793eb8a74d'
const addr = '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211'

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

  describe('#getSwapId', () => {
    it('getSwapId returns same result as getSwapIdAsProvider', async () => {
      const swapId = await contract.getSwapId(
        1,
        token,
        'ETH',
        token,
        addr
      );
      const swapIdAsProvider = await contract.getSwapIdAsProvider(
        BigNumber.from(1),
        token,
        token,
        addr
      );
      expect(swapIdAsProvider).to.equal(swapId);
    })

    it('getSwapIdAsProvider returns same result as the js function', async () => {
      const swapIdAsProvider = await contract.getSwapIdAsProvider(
        BigNumber.from(1),
        token,
        token,
        addr
      );

      const swap: Swap = {
        inToken: '0x943f0cabc0675f3642927e25abfa9a7ae15e8672',
        outToken: '0x2151166224670b37ec76c8ee2011bbbf4bbf2a52',
        chain: 'ETH',
        receiver: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
        amount: 1,
      }
      const swapId = getSwapId(swap);
      expect(swapId).to.equal(swapIdAsProvider);
    })
  })

  describe('#getSwapHash', () => {
    it('getSwapHash returns same result as the js function', async () => {
      const swap: Swap = {
        inToken: '0x943f0cabc0675f3642927e25abfa9a7ae15e8672',
        outToken: '0x2151166224670b37ec76c8ee2011bbbf4bbf2a52',
        chain: 'ETH',
        receiver: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
        amount: 1,
      }
      const swapId = getSwapId(swap);
      const epoch = 10;

      const swapHash = await contract.getSwapHash(swapId, epoch);
      const swapHashAsProvider = signSwap(swap, epoch);
      expect(swapHashAsProvider).to.equal(swapHash);
    })
  })
})
