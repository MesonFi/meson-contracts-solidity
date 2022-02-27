import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { MockProvider } from 'ethereum-waffle';
import { Wallet } from '@ethersproject/wallet'
import { ContractFactory } from '@ethersproject/contracts'
import { AddressZero } from '@ethersproject/constants'
import { Meson } from '@mesonfi/contract-types'
import { Meson as MesonAbi } from '@mesonfi/contract-abis'

import {
  MesonClient,
  EthersWalletSwapSigner,
  SwapWithSigner,
} from '../src'

import { getDefaultSwap } from './shared'

const outChain = '0x1234'
const token = '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211'
const unsupported = AddressZero

chai.use(chaiAsPromised)

describe('MesonClient', () => {
  let initiator: Wallet
  let provider: Wallet
  let swapSigner: EthersWalletSwapSigner
  let mesonInstance: Meson
  let mesonClient: MesonClient

  beforeEach('deploy Meson contract', async () => {
    const wallets = new MockProvider().getWallets()
    initiator = wallets[1]
    provider = wallets[2]
    swapSigner = new EthersWalletSwapSigner(initiator)
    const mesonFactory = new ContractFactory(MesonAbi.abi, MesonAbi.bytecode, wallets[0])
    mesonInstance = await mesonFactory.deploy([token]) as Meson
    mesonClient = await MesonClient.Create(mesonInstance)
  })

  describe('#shortCoinType', () => {
    it('returns the shortCoinType', () => {
      expect(mesonClient.shortCoinType).to.equal('0x003c')
    })
  })

  describe('#token', () => {
    it('rejects 0 or undefined index', () => {
      expect(() => mesonClient.token()).to.throw('Token index cannot be zero')
      expect(() => mesonClient.token(0)).to.throw('Token index cannot be zero')
    })
    it('returns token for an in-range index', () => {
      expect(mesonClient.token(1)).to.equal(token)
    })
    it('returns undefined for out-of-range index', () => {
      expect(mesonClient.token(2)).to.equal('')
    })
  })

  describe('#requestSwap', () => {
    it('rejects if swap signer is not set', () => {
      expect(() => mesonClient.requestSwap(getDefaultSwap(), outChain))
        .to.throw('No swap signer assigned')
    })
    it('returns a SwapWithSigner if swap signer is set', () => {
      mesonClient.setSwapSigner(swapSigner)
      const swap = mesonClient.requestSwap(getDefaultSwap(), outChain)
      expect(swap).to.be.an.instanceof(SwapWithSigner)
    })
  })

  describe('#depositAndRegister', () => {
    it('rejects unsupported token', async () => {
      await expect(mesonClient.depositAndRegister(unsupported, '1', '1'))
        .to.be.rejectedWith('Token not supported')
    })
  })

  describe('#deposit', () => {
    it('rejects unsupported token', async () => {
      await expect(mesonClient.deposit(unsupported, '1'))
        .to.be.rejectedWith('Token not supported')
    })
  })

  describe('#postSwap', () => {
    it('rejects unregistered provider', async () => {
      const signedRequest = {}
      await expect(mesonClient.postSwap(signedRequest))
        .to.be.rejectedWith(/not registered/)
    })
  })

  describe('#lock', async () => {
    it('rejects swap  already exists', async () => {
    })
  })

  describe('#unlock', async () => {
    it('rejects swap  already exists', async () => {
    })
  })

  describe('#release', async () => {
    it('rejects swap does not exist', async () => {
    })
  })

  describe('#executeSwap', () => {
    it('rejects Caller not registered', async () => {
    })
  })

  describe('#cancelSwap', () => {
    it('rejects Caller not registered', async () => {
    })
  })

  describe('#getPostedSwap', () => {
    it('rejects invalid encoded', async () => {
      await expect(mesonClient.getPostedSwap(''))
        .to.be.rejectedWith(/Invalid encoded\./)
    })
  })

  describe('#getLockedSwap', () => {
    it('rejects Caller not registered', async () => {
    })
  })
})
