import { waffle } from 'hardhat'
import {
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} from '@mesonfi/sdk/src'
import { MockToken, MesonPoolsTest ,MesonSwapTest} from '@mesonfi/contract-types'
import { expect } from '../shared/expect'
import { initiator, provider } from '../shared/wallet'
import { fixtures, TOKEN_BALANCE } from '../shared/fixtures'
import { getDefaultSwap, getDefaultSwap2 } from '../shared/meson'

describe('MesonSwap', () => {
  let token: MockToken
  let unsupportedToken: MockToken
  let mesonInstance: MesonSwapTest
  let outChain: string
  let userClient: MesonClient
  let lpClient: MesonClient


  describe('#Swap', () => {
     it('rejects missing amount', async () => {
      const result = await waffle.loadFixture(() => fixtures([
        initiator.address, provider.address
      ]))
      token = result.token1.connect(initiator)
      mesonInstance = result.swap // default account is signer
    })
      it('rejects missing expireTs', async () => {

      })
      it('rejects Missing fee', async () => {

      })
      it('rejects Missing inChain', async () => {

      })
      it('rejects Invalid inToken', async () => {

      })
      it('rejects Missing outChain', async () => {

      })
      it('rejects Invalid outToken', async () => {

        
      })
      it('rejects Invalid outToken', async () => {

      })
      it('accepts the Swap if all parameters are correct', async () => {
        const result = await waffle.loadFixture(() => fixtures([
          initiator.address, provider.address
        ]))
        token = result.token1.connect(initiator)
        mesonInstance = result.swap // default account is signer
        lpClient = await MesonClient.Create(mesonInstance)
        outChain = lpClient.shortCoinType
        expect(outChain).to.equal('0x0001')
      })
    })
})