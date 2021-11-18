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
    await list.createNewList()
  })

  describe('#getListLength', () => {
    it('is 0', async () => {
      expect(await list.getListLength()).to.eq(0)
    })
  })
})