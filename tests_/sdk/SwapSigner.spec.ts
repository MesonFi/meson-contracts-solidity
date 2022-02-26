import {
  SwapSigner,
  EthersWalletSwapSigner,
  RemoteSwapSigner,
} from '@mesonfi/sdk/src'

describe('SwapSigner', () => {
  let swapSigner: SwapSigner
  let encodedSwap: string = ''
  let recipient: string = ''

  const fixture = async () => {
  }

  beforeEach('deploy MesonStatesTest', async () => {
  })
  
  describe('#getAddress', () => {
    it('returns the signer address"', async () => {
    })
  })

  describe('#signSwapRequest', () => {
    it('rejects by "Not implemented"', async () => {
    })
  })

  describe('#signSwapRelease', () => {
    it('rejects by "Not implemented"', async () => {
    })
  })

  describe('#SwapSigner.hashRequest', () => {
    it('hashes swap request for testnet', async () => {
      SwapSigner.hashRequest(encodedSwap, true)
    })

    it('hashes swap request for mainnet', async () => {
      SwapSigner.hashRequest(encodedSwap, false)
    })
  })

  describe('#SwapSigner.hashRelease', () => {
    it('hashes swap release for testnet', async () => {
      SwapSigner.hashRelease(encodedSwap, recipient, true)
    })

    it('hashes swap release for mainnet', async () => {
      SwapSigner.hashRelease(encodedSwap, recipient, false)
    })
  })
})


describe('RemoteSwapSigner', () => {
  let swapSigner: EthersWalletSwapSigner
  let encodedSwap: string = ''
  let recipient: string = ''

  const fixture = async () => {
  }

  beforeEach('deploy MesonStatesTest', async () => {
  })
  
  describe('#getAddress', () => {
    it('returns the signer address', async () => {
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


describe('EthersWalletSwapSigner', () => {
  let swapSigner: RemoteSwapSigner
  let encodedSwap: string = ''
  let recipient: string = ''

  const fixture = async () => {
  }

  beforeEach('deploy MesonStatesTest', async () => {
  })
  
  describe('#getAddress', () => {
    it('rejects by "Not implemented"', async () => {
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