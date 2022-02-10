import { waffle } from 'hardhat'
import {
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} from '@mesonfi/sdk/src'
import { MockToken, MesonPoolsTest } from '@mesonfi/contract-types'
import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
import { fixtures, TOKEN_BALANCE, TOKEN_TOTAL_SUPPLY } from './shared/fixtures'
import { getDefaultSwap } from './shared/meson'


describe('MesonPools', () => {
  let token: MockToken
  let mesonInstance: MesonPoolsTest
  let outChain: string
  let userClient: MesonClient
  let lpClient: MesonClient

  beforeEach('deploy MesonPoolsTest', async () => {
    const result = await waffle.loadFixture(() => fixtures([
      initiator.address, provider.address
    ]))
    token = result.token1.connect(provider)
    mesonInstance = result.pools.connect(provider) // provider is signer

    userClient = await MesonClient.Create(result.pools, new EthersWalletSwapSigner(initiator))
    lpClient = await MesonClient.Create(mesonInstance)
    outChain = lpClient.shortCoinType
    await token.approve(mesonInstance.address, 1000)
  })

  describe('#depositAndRegister', () => {
    it('accepts the depoit if all parameters are correct', async () => {
      await lpClient.depositAndRegister(lpClient.token(1), '1000', '1')
      expect(await mesonInstance.balanceOf(lpClient.token(1), provider.address)).to.equal(1000)
      expect(await token.balanceOf(mesonInstance.address)).to.equal(1000)
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE.sub(1000))
    })
    it('rejects negative amount', async () => {
      try {
        await lpClient.depositAndRegister(lpClient.token(1), '-100', '1')
      } catch (error) {
        expect(error.reason).to.equal("value out-of-bounds")
      }
    })
    it('rejects zero amount', async () => {
      try {
        await lpClient.depositAndRegister(lpClient.token(1), '0', '1')
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if amount overflow', async () => {
      try {
        await lpClient.depositAndRegister(lpClient.token(1), '10000000000000000000000000000000000000000000000000000', '1')
      } catch (error) {
        expect(error.reason).to.throw
      }
    })
    it('rejects the amount if no enough appove', async () => {
      try {
        await lpClient.depositAndRegister(lpClient.token(1), '1000000', '1')
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects Index already registered', async () => {
      try {
        await lpClient.depositAndRegister(lpClient.token(1), '1000', '1')
        await lpClient.depositAndRegister(lpClient.token(1), '10', '1')
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if provider index is zero', async () => {
      try {
        await lpClient.depositAndRegister(lpClient.token(1), '0', '0')
      } catch (error) {

      }
    })
    it('rejects if the address is already registered', async () => {
      try {
        await lpClient.depositAndRegister(lpClient.token(1), '1000', '1')
        await lpClient.depositAndRegister(lpClient.token(1), '1000', '1')
      } catch (error) {
        console.log(error)
        expect(error).to.throw
      }
    })
    it('rejects if the index is already registered', async () => {
      try {
        await lpClient.depositAndRegister(lpClient.token(1), '1000', '1')
      } catch (error) {
        console.log(error)
        expect(error).to.throw
      }
    })
    it('refuses unsupported token', async () => {
      try {
        let s = await lpClient.depositAndRegister(lpClient.token(2), '1000', '1')
      } catch (error) {
        console.log(error)
        expect(error).to.throw
      }
    })
  })

  describe('#deposit', () => {
    it('rejects negative  amount', async () => {
      try {
        await mesonInstance.deposit(-1, 1)
      } catch (error) {
        expect(error).to.throw
      }
      // expect() check  Amount must be positive
    })
    it('rejects zero amount ', async () => {
      expect(await mesonInstance.deposit(0, 1)).to.throw(/Amount must be positive/)
    })
    it('rejects if amount overflow', async () => {
      expect(await mesonInstance.deposit(100000000000000000000000000000000, 1)).to.throw
    })
    it('rejects the amount if no enough appove', async () => {
      expect(await mesonInstance.deposit(100000000000000000000000000000000, 1)).to.throw(/ERC20: transfer amount exceeds allowance/)
    })
  })

  describe('#lock', async () => {
    it('rejects swap  already exists', async () => {
      // expect() check Swap 
    })
    it(' rejects caller not registered', async () => {
      // expect() check  provider the Index
    })
  })

  describe('#unlock', async () => {
    it('rejects swap  does not exist', async () => {
      //expect () check lockedSwap
    })
    it('rejects swap still in lock', async () => {
      //expect () check block.timestamp <
    })
    it('rejects swap still in lock', async () => {
      //expect () check block.timestamp ==
    })
  })

  describe('#release', async () => {
    it('rejects swap does not exist ', async () => {
      //expect () check lockedSwap 
    })
    it('refuses unsupported token', async () => {
      //expect () check  unsupported token 
    })
  })

  describe('#withdraw', () => {
    it('rejects Caller not registered', async () => {
      //expect() check  provider the Index
      await expect(mesonInstance.withdraw('1', 1)).to.be.revertedWith('underflow')
    })
    it('refuses unsupported token', async () => {
      //expect () check  unsupported token 
    })
  })
})
