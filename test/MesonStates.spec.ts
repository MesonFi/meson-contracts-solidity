import { ethers, waffle } from 'hardhat'
import { MesonStatesTest } from '@meson/contract-types'

import { expect } from './shared/expect'

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

  describe('#updateDemand', () => {
    it('update demand', async () => {
      await contract.updateDemand(token, 100)

      // Verify it's added to the list
      const list = await contract.getRecentSwapList(token)
      expect(list._items).has.lengthOf(1)
      // Verify it's added to the mapping
      const swap = await contract.getRecentSwap(token, list._items[0])
      expect(swap.id).to.not.equal(0)
      // Verify demand/supply
      expect(await contract.totalDemandFor(token)).to.equal(100);
      expect(await contract.totalSupplyFor(token)).to.equal(0);
    })
  })

  describe('#removeExpiredSwaps', () => {
    const id0 = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const id1 = "0x464f9a206dee56c06e8f668bc1933f6286aa952f7cea9d677e18b5f089555fa1";
    const id2 = "0x464f9a206dee56c06e8f668bc1933f6286aa952f7cea9d677e18b5f089555fa2";
    const amount = 100;
    const expiredTs = 1;
    const validTs = Math.floor(Date.now() / 1000);

    async function verifySwapRecords(remainingIds: string[], removedIds: string[]) {
      const list = await contract.getRecentSwapList(token)
      expect(list._length).to.equal(remainingIds.length)
      // TODO: removed ones should be GCed
      expect(list._items).has.lengthOf(remainingIds.length + removedIds.length)
      for (const id of remainingIds) {
        expect((await contract.getRecentSwap(token, id)).id).to.equal(id)
      }
      for (const id of removedIds) {
        expect((await contract.getRecentSwap(token, id)).id).to.equal(id0)
      }
    }

    it('remove expired with no swap request', async () => {
      await contract.removeExpiredSwaps(token)
      await verifySwapRecords([], [])
    })

    it('remove expired with one expired request', async () => {
      await contract.addRecentSwap(token, id1, amount, expiredTs)
      await contract.removeExpiredSwaps(token)
      await verifySwapRecords([], [id1])
    })

    it('remove expired with one non-expired request', async () => {
      await contract.addRecentSwap(token, id1, amount, validTs)
      await contract.removeExpiredSwaps(token)
      await verifySwapRecords([id1], [])
    })

    it('remove expired with one expired and one non-expired requests', async () => {
      await contract.addRecentSwap(token, id1, amount, expiredTs)
      await contract.addRecentSwap(token, id2, amount, validTs)
      await contract.removeExpiredSwaps(token)
      await verifySwapRecords([id2], [id1])
    })
  })
})
