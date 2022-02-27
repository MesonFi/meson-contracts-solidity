import { ethers, waffle } from 'hardhat'
import {
  MesonClient,
  Swap,
  EthersWalletSwapSigner,
  PartialSwapData,
  SwapWithSigner,
} from '@mesonfi/sdk'
import { MesonStatesTest } from '@mesonfi/contract-types'

import { expect } from '../test/shared/expect'
import { initiator } from '../test/shared/wallet'
import { getDefaultSwap } from '../test/shared/meson'


describe('MesonSwap', () => {
  let mesonInstance: MesonStatesTest
  let mesonClient: MesonClient
  let swapData: PartialSwapData
  let swap: SwapWithSigner
  let OtherAddress = '0x7F342A0D04B951e8600dA1eAdD46afe614DaC20B'
  const testnetMode = true

  beforeEach('deploy MesonStatesTest', async () => {
    const factory = await ethers.getContractFactory('MesonStatesTest')
    mesonInstance = await factory.deploy()

    const outChain = await mesonInstance.getShortCoinType()
    mesonClient = await MesonClient.Create(mesonInstance as any, new EthersWalletSwapSigner(initiator))
    swapData = getDefaultSwap({ inToken: 2, outToken: 3 })
    swap = mesonClient.requestSwap(swapData, outChain)
  })


  describe('#checkRequestSignature', () => {

    it('rejects  Invalid signature"', async () => {
      try {
        const sigs = (await swap.signForRequest(testnetMode)).signature
        await mesonInstance.checkRequestSignature(swap.encoded, ...sigs, OtherAddress)
      } catch (error) {
        expect(error).to.match(/Invalid signature/)
      }
    })
    it(' accepts  signature', async () => {
      const sigs = (await swap.signForRequest(testnetMode)).signature
      await mesonInstance.checkRequestSignature(swap.encoded, ...sigs, initiator.address)
    })

  })

  describe('#checkReleaseSignature', () => {
    it('accepts validates a release signature', async () => {
      const sigs = (await swap.signForRequest(testnetMode)).signature
      await mesonInstance.checkRequestSignature(swap.encoded, ...sigs, initiator.address)
    })
    it('Invalid signature', async () => {
      try {
        const sigs = (await swap.signForRequest(testnetMode)).signature
        await mesonInstance.checkRequestSignature(swap.encoded, ...sigs, OtherAddress)
      } catch (error) {
        expect(error).to.match(/Invalid signature/)
      }
    })
  })
})