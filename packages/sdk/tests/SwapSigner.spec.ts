import {
  SwapSigner,
  EthersWalletSwapSigner,
  RemoteSwapSigner,
} from '../src'
import { expect } from 'chai'

describe('SwapSigner', () => {
  let swapSigner: SwapSigner
  let encodedSwap: string = ''
  let recipient: string = ''

  beforeEach('create SwapSigner', async () => {
  })
  
  describe('#getAddress', () => {
    it('returns the signer address"', async () => {
      swapSigner.getAddress()
    })
  })

  describe('#signSwapRequest', () => {
    it('rejects by "Not implemented"', async () => {
      swapSigner.signSwapRequest(encodedSwap)
    })
  })

  describe('#signSwapRelease', () => {
    it('rejects by "Not implemented"', async () => {
      swapSigner.signSwapRelease(encodedSwap, recipient)
    })
  })

  describe('#SwapSigner.hashRequest', () => {
    it('hashes a swap request for testnet', async () => {
      SwapSigner.hashRequest(encodedSwap, true)
    })

    it('hashes a swap request for mainnet', async () => {
      SwapSigner.hashRequest(encodedSwap, false)
    })
  })

  describe('#SwapSigner.hashRelease', () => {
    it('hashes a swap release for testnet', async () => {
      SwapSigner.hashRelease(encodedSwap, recipient, true)
    })

    it('hashes a swap release for mainnet', async () => {
      SwapSigner.hashRelease(encodedSwap, recipient, false)
    })
  })
})


describe('EthersWalletSwapSigner', () => {
  let swapSigner: EthersWalletSwapSigner
  let encodedSwap: string = ''
  let recipient: string = ''

  beforeEach('create EthersWalletSwapSigner', async () => {
  })
  
  describe('#getAddress', () => {
    it('returns the signer address', async () => {
      swapSigner.getAddress()
    })
  })

  describe('#signSwapRequest', () => {
    it('signs a swap request for testnet', async () => {
      swapSigner.signSwapRequest(encodedSwap, true)
    })
    it('signs a swap request for mainnet', async () => {
      swapSigner.signSwapRequest(encodedSwap, false)
    })
  })

  describe('#signSwapRelease', () => {
    it('signs a swap release for testnet', async () => {
      swapSigner.signSwapRelease(encodedSwap, recipient, true)
    })
    it('signs a swap release for mainnet', async () => {
      swapSigner.signSwapRelease(encodedSwap, recipient, false)
    })
  })
})


describe('RemoteSwapSigner', () => {
  let swapSigner: RemoteSwapSigner
  let encodedSwap: string = ''
  let recipient: string = ''

  beforeEach('create RemoteSwapSigner', async () => {
  })
  
  describe('#getAddress', () => {
    it('rejects by "Not implemented"', async () => {
      swapSigner.getAddress()
    })
  })

  describe('#signSwapRequest', () => {
    it('signs a swap request for testnet', async () => {
      swapSigner.signSwapRequest(encodedSwap, true)
    })
    it('signs a swap request for mainnet', async () => {
      swapSigner.signSwapRequest(encodedSwap, false)
    })
  })

  describe('#signSwapRelease', () => {
    it('signs a swap release for testnet', async () => {
      swapSigner.signSwapRelease(encodedSwap, recipient, true)
    })
    it('signs a swap release for mainnet', async () => {
      swapSigner.signSwapRelease(encodedSwap, recipient, false)
    })
  })
})