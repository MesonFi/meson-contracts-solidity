import { expect } from 'chai'
import { solidity, MockProvider } from 'ethereum-waffle';
import { AddressZero } from '@ethersproject/constants'
import {
  SwapSigner,
  EthersWalletSwapSigner,
  RemoteSwapSigner,
} from '../src'
import { Wallet } from '@ethersproject/wallet'


describe('SwapSigner', () => {
  let swapSigner: SwapSigner
  let ethersWalletSwapSigner: EthersWalletSwapSigner
  let encodedSwap: string = '0x000000000000000000000064000003c1000000000a00620a4c3e000101000101'
  let recipient: string = '0x83bcD6A6a860EAac800A45BB1f4c30248e5Dc619'
  let initiator: Wallet

  beforeEach('create SwapSigner', async () => {
    const wallets = new MockProvider().getWallets()
    initiator = wallets[1]
    swapSigner = new SwapSigner
    ethersWalletSwapSigner = new EthersWalletSwapSigner(initiator)
  })

  describe('#getAddress', () => {
    it('returns the signer address"', async () => {
      expect(ethersWalletSwapSigner.getAddress()).to.equal(initiator.address)
    })
  })

  describe('#signSwapRequest', () => {
    it('rejects by "Not implemented"', async () => {
      try {
        await swapSigner.signSwapRequest(encodedSwap)
      } catch (error) {
        expect(error).to.match(/Not implemented/)
      }
    })
  })

  describe('#signSwapRelease', () => {
    it('rejects by "Not implemented"', async () => {
      try {
        await swapSigner.signSwapRelease(encodedSwap, recipient)
      } catch (error) {
        expect(error).to.match(/Not implemented/)
      }
    })
  })

  describe('#SwapSigner.hashRequest', () => {
    it('hashes a swap request for testnet', async () => {
      expect(SwapSigner.hashRequest(encodedSwap, false)).to.not.null
    })

    it('hashes a swap request for mainnet', async () => {
      expect(SwapSigner.hashRequest(encodedSwap, false)).to.not.null
    })


    describe('#SwapSigner.hashRelease', () => {
      it('hashes a swap release for testnet', async () => {
        expect(SwapSigner.hashRelease(encodedSwap, recipient, true)).to.not.null
      })

      it('hashes a swap release for mainnet', async () => {
        expect(SwapSigner.hashRelease(encodedSwap, recipient, false)).to.not.null
      })
    })

    describe('EthersWalletSwapSigner', () => {
      describe('#getAddress', () => {
        it('returns the signer address', async () => {
          expect(ethersWalletSwapSigner.getAddress()).to.equal(initiator.address)
        })
      })

      describe('#signSwapRequest', () => {
        it('signs a swap request for testnet', async () => {
          expect(ethersWalletSwapSigner.signSwapRequest(encodedSwap, true)).to.not.null
        })
        it('signs a swap request for mainnet', async () => {
          expect(ethersWalletSwapSigner.signSwapRequest(encodedSwap)).to.not.null
        })
      })

      describe('#signSwapRelease', () => {
        it('signs a swap release for testnet', async () => {
          expect(ethersWalletSwapSigner.signSwapRelease(encodedSwap, recipient, true)).to.not.null

        })
        it('signs a swap release for mainnet', async () => {
          expect(ethersWalletSwapSigner.signSwapRelease(encodedSwap, recipient, false)).to.not.null
        })
      })
    })


    describe('RemoteSwapSigner', () => {
      let remoteSwapSigner: RemoteSwapSigner
      let encodedSwap: string = '0x000000000000000000000064000003c1000000000a00620a4c3e000101000101'
      let recipient: string = '0x83bcD6A6a860EAac800A45BB1f4c30248e5Dc619'

      beforeEach('create RemoteSwapSigner', async () => {
        remoteSwapSigner = new RemoteSwapSigner()
      })
      describe('#getAddress', () => {
        it('rejects by "Not implemented"', async () => {
          try {
            await remoteSwapSigner.signSwapRelease(encodedSwap, recipient)
          } catch (error) {
            expect(error).to.match(/Not implemented/)
          }
        })
      })

      describe('#signSwapRequest', () => {
        it('signs a swap request for testnet', async () => {
          expect(remoteSwapSigner.signSwapRequest(encodedSwap, true)).to.not.null
        })
        it('signs a swap request for mainnet', async () => {
          expect(remoteSwapSigner.signSwapRequest(encodedSwap)).to.not.null
        })
      })

      describe('#signSwapRelease', () => {
        it('signs a swap release for testnet', async () => {
          expect(remoteSwapSigner.signSwapRelease(encodedSwap, recipient, true)).to.not.null
        })
        it('signs a swap release for mainnet', async () => {
          expect(remoteSwapSigner.signSwapRelease(encodedSwap, recipient, false)).to.not.null
        })

      })

    })

  })
})