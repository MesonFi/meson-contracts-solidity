import { expect } from 'chai'

import {
  SwapWithSigner,
} from '../src'

describe('SwapWithSigner', () => {
  let swapWithSigner: SwapWithSigner
  let recipient: string = ''

  beforeEach('create SwapWithSigner', async () => {
  })
  
  describe('#signForRequest', () => {
    it('signs a swap request for testnet', async () => {
      swapWithSigner.signForRequest(true)
    })
    it('signs a swap request for mainnet', async () => {
      swapWithSigner.signForRequest(false)
    })
  })

  describe('#signForRelease', () => {
    it('signs a swap release for testnet', async () => {
      swapWithSigner.signForRelease(recipient, true)
    })
    it('signs a swap release for mainnet', async () => {
      swapWithSigner.signForRelease(recipient, false)
    })
  })
})
