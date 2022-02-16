import { waffle } from 'hardhat'
import {
  Swap,
  MesonClient,
  PartialSwapData,
  EthersWalletSwapSigner,
  SwapWithSigner
} from '@mesonfi/sdk/src'
import { MockToken, MesonSwapTest } from '@mesonfi/contract-types'
import { expect } from '../shared/expect'
import { initiator } from '../shared/wallet'
import { getDefaultSwap } from '../shared/meson'
describe('MesonSwap', () => {
  let mesonInstance: MesonSwapTest
  let userClient: MesonClient
  let swap: SwapWithSigner
  let swapData: PartialSwapData
  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonStatesTest')
    return (await factory.deploy()) as MesonStatesTest
  }

  beforeEach('deploy MesonStatesTest', async () => {
    mesonInstance = await waffle.loadFixture(fixture)
    const outChain = await mesonInstance.getShortCoinType()
    userClient = await MesonClient.Create(mesonInstance as any, new EthersWalletSwapSigner(initiator))
    swapData = getDefaultSwap({ inToken: 2, outToken: 3 })
    swap = userClient.requestSwap(swapData, outChain)
  })
  describe('#Swap', () => {
    it('rejects missing amount', async () => {

      try {
        const swap2 = new Swap(getDefaultSwap({ amount: '' }))
      } catch (error) {
        expect(error).to.throw
      }

    })
    it('rejects missing expireTs', async () => {
      try {
        const swap2 = new Swap(getDefaultSwap({ expireTs: '' }))
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects Missing fee', async () => {
      try {
        const swap2 = new Swap(getDefaultSwap({ fee: '' }))
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects Missing inChain', async () => {
      try {
        const swap2 = new Swap(getDefaultSwap({ inChain: null }))
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects Missing outChain', async () => {
      try {
        const swap2 = new Swap(getDefaultSwap({ outChain: null }))
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects Invalid outToken', async () => {
      try {
        const swap2 = new Swap(getDefaultSwap({ outToken: null }))
      } catch (error) {
        expect(error).to.throw
      }

    })
    it('accepts the Swap if all parameters are correct', async () => {
      const swapData = {
        amount: '10',
        salt: 10,
        fee: '10',
        expireTs: 12376874,
        inChain: '0x0001',
        inToken: 1,
        outChain: '1',
        outToken: 1,
      }
      const swap2 = new Swap(swapData)
      expect(swap2.amount).to.equal(swapData.amount)
      expect(swap2.salt).to.equal(swapData.salt)
      expect(swap2.fee).to.equal(swapData.fee)
      expect(swap2.expireTs).to.equal(swapData.expireTs)
      expect(swap2.outChain).to.equal(swapData.outChain)
      expect(swap2.outToken).to.equal(swapData.outToken)
      expect(swap2.inChain).to.equal(swapData.inChain)
      expect(swap2.inToken).to.equal(swapData.inToken)
    })
  })

  describe('#decode', () => {
    it('encoded swap should be a hex string of length 66', async () => {
      try {
        const swap2 = Swap.decode('')
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the Swap if all parameters are correct', async () => {
      const swap2 = Swap.decode(swap.encoded)
      expect(swap2.amount).to.equal(swap.amount)
      expect(swap2.salt).to.equal(swap.salt)
      expect(swap2.fee).to.equal(swap.fee)
      expect(swap2.expireTs).to.equal(swap.expireTs)
      expect(swap2.outChain).to.equal(swap.outChain)
      expect(swap2.outToken).to.equal(swap.outToken)
      expect(swap2.inChain).to.equal(swap.inChain)
      expect(swap2.inToken).to.equal(swap.inToken)
    })
  })
})