import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { MockToken } from '../typechain/MockToken'
import { MesonPoolsTest } from '../typechain/MesonPoolsTest'

const token = '0x243f22fbd4c375581aaacfcfff5a43793eb8a74d'
const addr = '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211'

describe('MesonPools', () => {
  let tokenContract: MockToken
  const tokenFixture = async () => {
    const factory = await ethers.getContractFactory('MockToken')
    return (await factory.deploy(1000000)) as MockToken
  }

  let contract: MesonPoolsTest
  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonPoolsTest')
    const instance: MesonPoolsTest = await factory.deploy()
    await instance.addTokenToSwapList(token)
    return instance
  }

  beforeEach('deploy MesonPoolsTest', async () => {
    contract = await waffle.loadFixture(fixture)
    tokenContract = await waffle.loadFixture(tokenFixture)
  })

  // describe('#totalSupplyFor', () => {
  //   it('is zero', async () => {
  //     expect(await contract.totalSupplyFor(token)).to.equal(0)
  //   })
  // })

  describe('#totalSupply', () => {
    it('is 1000000', async () => {
      expect(await tokenContract.totalSupply()).to.equal(1000000)
    })
  })
})
