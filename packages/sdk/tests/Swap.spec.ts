import {
  Swap,
} from '../src'
import { expect } from 'chai'
import { getDefaultSwap } from './shared'

describe('Swap', () => {
  describe('#constructor', () => {
    it('rejects missing amount', async () => {
      expect(new Swap(getDefaultSwap({ amount: '' }))).to.throw(/Missing amount/)
    })
    it('rejects missing expireTs', async () => {
      try {
        const swap2 = new Swap(getDefaultSwap({ expireTs: '' }))
      } catch (error) {
         
        expect(error).to.match(/Missing expireTs/)
      }
    })
    it('rejects Missing fee', async () => {
      try {
        const swap2 = new Swap(getDefaultSwap({ fee: '' }))
      } catch (error) {
      expect(error).to.match(/Missing fee/)
      }
    })
    it('rejects Missing inChain', async () => {
      try {
        const swap2 = new Swap({
          inToken:1,
          outToken:1,
          amount : '1000',
          fee: '0',
          expireTs:100,
          inChain:'',
          outChain:'1'
        })
      } catch (error) {
        expect(error).to.match(/Missing inChain/)
      }
    })
    it('rejects Missing outChain', async () => {
      try {
        const swap2 = new Swap({
          inToken:1,
          outToken:1,
          amount : '1000',
          fee: '0',
          expireTs:100,
          inChain:'1',
          outChain:''
        })
      } catch (error) {
         
        expect(error).to.match(/Missing outChain/)
      }
    })
    it('rejects Invalid outToken', async () => {
      try {
        const swap2 = new Swap({
          inToken:1,
          outToken:null,
          amount : '1000',
          fee: '0',
          expireTs:100,
          inChain:'1',
          outChain:'1'
        })
      } catch (error) {
         
        expect(error).to.match(/Invalid outToken/)
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

  describe('#Swap.decode', () => {
    it('encoded swap should be a hex string of length 66', async () => {
      try {
        const swap2 = Swap.decode('')
      } catch (error) {
        expect(error).to.match(/encoded swap should be a hex string of length 66/)
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

  describe('#toObject', () => {
    it('exports the swap as an object', async () => {
    })
  })
})