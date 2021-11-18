import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
// import snapshotGasCost from './shared/snapshotGasCost'
import { ListTest } from '../typechain/ListTest'

describe('List', () => {
  let list: ListTest
  const fixture = async () => {
    const factory = await ethers.getContractFactory('ListTest')
    return (await factory.deploy()) as ListTest
  }

  beforeEach('deploy ListTest', async () => {
    list = await waffle.loadFixture(fixture)
  })

  describe('#createNewList', () => {
    it('returns true', async () => {
      await expect(list.createNewList()).to.be.true
    })
  })
})