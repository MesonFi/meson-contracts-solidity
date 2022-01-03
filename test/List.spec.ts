import { ethers, waffle } from 'hardhat'
import { ListTest } from '@meson/contract-types'

import { expect } from './shared/expect'

const addr = '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211'

describe('List', () => {
  let contract: ListTest
  const fixture = async () => {
    const factory = await ethers.getContractFactory('ListTest')
    return (await factory.deploy()) as ListTest
  }

  beforeEach('deploy ListTest', async () => {
    contract = await waffle.loadFixture(fixture)
  })

  const item1 = '0x0000000000000000000000000000000000000000000000000000000000000001'
  const item2 = '0x0000000000000000000000000000000000000000000000000000000000000002'
  const item3 = '0x0000000000000000000000000000000000000000000000000000000000000003'
  const item4 = '0x0000000000000000000000000000000000000000000000000000000000000004'

  describe('#addItem', () => {
    it('is empty array', async () => {
      expect(await contract.getListItems(addr)).to.be.an('array').that.is.empty;
    })

    it('add one item', async () => {
      await contract.addItem(addr, item1)

      expect(await contract.getListLength(addr)).to.eq(1)
      expect(await contract.getListTail(addr)).to.eq(0)
      expect(await contract.getListHead(addr)).to.eq(0)
    })

    it('add 3 items', async () => {
      await contract.addItem(addr, item1)
      await contract.addItem(addr, item2)
      await contract.addItem(addr, item3)

      expect(await contract.getListLength(addr)).to.eq(3)
      expect(await contract.getListTail(addr)).to.eq(0)
      expect(await contract.getListHead(addr)).to.eq(2)
    })
  })

  describe('#popItem', () => {
    it('add 3 items and remove 2', async () => {
      await contract.addItem(addr, item1)
      await contract.addItem(addr, item2)
      await contract.addItem(addr, item3)
      await contract.popItem(addr)
      await contract.popItem(addr)

      expect(await contract.getListLength(addr)).to.eq(1)
      expect(await contract.getListTail(addr)).to.eq(2)
      expect(await contract.getListHead(addr)).to.eq(2)
    })

    it('add 3 items and remove 4', async () => {
      await contract.addItem(addr, item1)
      await contract.addItem(addr, item2)
      await contract.addItem(addr, item3)
      await contract.popItem(addr)
      await contract.popItem(addr)
      await contract.popItem(addr)
      await contract.popItem(addr)

      expect(await contract.getListLength(addr)).to.eq(0)
      expect(await contract.getListTail(addr)).to.eq(3)
      expect(await contract.getListHead(addr)).to.eq(2)
    })

    it('add 2 items, remove 3, and 2 items', async () => {
      await contract.addItem(addr, item1)
      await contract.addItem(addr, item2)
      await contract.popItem(addr)
      await contract.popItem(addr)
      await contract.popItem(addr)
      await contract.addItem(addr, item3)
      await contract.addItem(addr, item4)

      expect(await contract.getListLength(addr)).to.eq(2)
      expect(await contract.getListTail(addr)).to.eq(2)
      expect(await contract.getListHead(addr)).to.eq(3)
    })
  })
})
