import { expect } from 'chai'
import { BigNumber } from '@ethersproject/bignumber'

import { Swap } from '../src'
import { getSwap } from './shared'

describe('Swap', () => {
  describe('#constructor', () => {
    it('rejects if missing amount', () => {
      expect(() => new Swap(getSwap({ amount: 0 }))).to.throw('Invalid amount')
    })
    it('rejects Missing fee', () => {
      expect(() => new Swap(getSwap({ fee: '' }))).to.throw('Missing fee')
    })
    it('rejects if missing expireTs', () => {
      expect(() => new Swap(getSwap({ expireTs: 0 }))).to.throw('Missing expireTs')
    })
    it('rejects if missing inChain', () => {
      expect(() => new Swap(getSwap({ inChain: '' }))).to.throw('Missing inChain')
    })
    it('rejects if inToken is not a number', () => {
      expect(() => new Swap(getSwap({ inToken: '' }))).to.throw('Invalid inToken')
    })
    it('rejects if missing outChain', () => {
      expect(() => new Swap(getSwap({ outChain: '' }))).to.throw('Missing outChain')
    })
    it('rejects if outToken is not a number', () => {
      expect(() => new Swap(getSwap({ outToken: '' }))).to.throw('Invalid outToken')
    })

    it('creates a swap if all parameters are correct', () => {
      const swapData = getSwap()
      const swap = new Swap(swapData)
      expect(swap.amount).to.equal(swapData.amount)
      expect(swap.salt).to.be.a('string')
      expect(swap.fee).to.equal(swapData.fee)
      expect(swap.expireTs).to.equal(swapData.expireTs)
      expect(swap.inChain).to.equal(swapData.inChain)
      expect(swap.inToken).to.equal(swapData.inToken)
      expect(swap.outChain).to.equal(swapData.outChain)
      expect(swap.outToken).to.equal(swapData.outToken)
    })
  })

  describe('#Swap.decode', () => {
    it('rejects invalid encoded', () => {
      expect(() => Swap.decode('')).to.throw('encoded swap should be a hex string of length 66')
    })

    const swapData = getSwap()
    const swap = new Swap(swapData)
    it('decodes the a valid hex string', () => {
      const decodedSwap = Swap.decode(swap.encoded)
      expect(decodedSwap.amount).to.equal(swap.amount)
      expect(decodedSwap.salt).to.equal(swap.salt)
      expect(decodedSwap.fee).to.equal(swap.fee)
      expect(decodedSwap.expireTs).to.equal(swap.expireTs)
      expect(decodedSwap.inChain).to.equal(swap.inChain)
      expect(decodedSwap.inToken).to.equal(swap.inToken)
      expect(decodedSwap.outChain).to.equal(swap.outChain)
      expect(decodedSwap.outToken).to.equal(swap.outToken)
    })

    it('decodes the a valid BigNumber', () => {
      const decodedSwap = Swap.decode(BigNumber.from(swap.encoded))
      expect(decodedSwap.amount).to.equal(swap.amount)
      expect(decodedSwap.salt).to.equal(swap.salt)
      expect(decodedSwap.fee).to.equal(swap.fee)
      expect(decodedSwap.expireTs).to.equal(swap.expireTs)
      expect(decodedSwap.inChain).to.equal(swap.inChain)
      expect(decodedSwap.inToken).to.equal(swap.inToken)
      expect(decodedSwap.outChain).to.equal(swap.outChain)
      expect(decodedSwap.outToken).to.equal(swap.outToken)
    })
  })

  describe('#toObject', () => {
    const swapData = getSwap()
    const swap = new Swap(swapData)
    it('exports the swap as an object', () => {
      const swapObject = swap.toObject()
      expect(swapObject.encoded).to.equal(swap.encoded)
      expect(swapObject.amount).to.equal(swap.amount)
      expect(swapObject.salt).to.equal(swap.salt)
      expect(swapObject.fee).to.equal(swap.fee)
      expect(swapObject.expireTs).to.equal(swap.expireTs)
      expect(swapObject.inChain).to.equal(swap.inChain)
      expect(swapObject.inToken).to.equal(swap.inToken)
      expect(swapObject.outChain).to.equal(swap.outChain)
      expect(swapObject.outToken).to.equal(swap.outToken)
    })
  })
})