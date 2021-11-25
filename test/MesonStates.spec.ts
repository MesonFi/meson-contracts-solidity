import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { MesonStatesTest } from '../typechain/MesonStatesTest'

const token = '0x243f22fbd4c375581aaacfcfff5a43793eb8a74d'

describe('MesonStates', () => {
  let contract: MesonStatesTest
  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonStatesTest')
    return (await factory.deploy(token)) as MesonStatesTest
  }

  beforeEach('deploy MesonStatesTest', async () => {
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
})
