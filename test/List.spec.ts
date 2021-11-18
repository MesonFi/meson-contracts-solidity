import { ethers, waffle } from 'hardhat'
import { expect } from './shared/expect'
import { ListTest } from '../typechain/ListTest'

const addr = '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211'

describe('List', () => {
  let list: ListTest
  const fixture = async () => {
    const factory = await ethers.getContractFactory('ListTest')
    return (await factory.deploy()) as ListTest
  }

  beforeEach('deploy ListTest', async () => {
    list = await waffle.loadFixture(fixture)
  })

  const item1 = '0x0000000000000000000000000000000000000000000000000000000000000001'
  const item2 = '0x0000000000000000000000000000000000000000000000000000000000000002'
  const item3 = '0x0000000000000000000000000000000000000000000000000000000000000003'
  const item4 = '0x0000000000000000000000000000000000000000000000000000000000000004'

  describe('#addItem', () => {
    it('is empty array', async () => {
      expect(await list.getListItems(addr)).to.be.an('array').that.is.empty;
    })

    it('add one item', async () => {
      await list.addItem(addr, item1)

      expect(await list.getListLength(addr)).to.eq(1)
      expect(await list.getListTail(addr)).to.eq(0)
      expect(await list.getListHead(addr)).to.eq(0)
      // expect(await list.getTail(addr)).to.eq(item1)
    })

    it('add 3 items', async () => {
      await list.addItem(addr, item1)
      await list.addItem(addr, item2)
      await list.addItem(addr, item3)

      expect(await list.getListLength(addr)).to.eq(3)
      expect(await list.getListTail(addr)).to.eq(0)
      expect(await list.getListHead(addr)).to.eq(2)
    })
  })

  describe('#popItem', () => {
    it('add 3 items and remove 2', async () => {
      await list.addItem(addr, item1)
      await list.addItem(addr, item2)
      await list.addItem(addr, item3)
      await list.popItem(addr)
      await list.popItem(addr)

      expect(await list.getListLength(addr)).to.eq(1)
      expect(await list.getListTail(addr)).to.eq(2)
      expect(await list.getListHead(addr)).to.eq(2)
    })

    it('add 3 items and remove 4', async () => {
      await list.addItem(addr, item1)
      await list.addItem(addr, item2)
      await list.addItem(addr, item3)
      await list.popItem(addr)
      await list.popItem(addr)
      await list.popItem(addr)
      await list.popItem(addr)

      expect(await list.getListLength(addr)).to.eq(0)
      expect(await list.getListTail(addr)).to.eq(3)
      expect(await list.getListHead(addr)).to.eq(2)
    })

    it('add 2 items, remove 3, and 2 items', async () => {
      await list.addItem(addr, item1)
      await list.addItem(addr, item2)
      await list.popItem(addr)
      await list.popItem(addr)
      await list.popItem(addr)
      await list.addItem(addr, item3)
      await list.addItem(addr, item4)

      expect(await list.getListLength(addr)).to.eq(2)
      expect(await list.getListTail(addr)).to.eq(2)
      expect(await list.getListHead(addr)).to.eq(3)
    })
  })
})
