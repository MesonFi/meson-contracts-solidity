import { waffle } from 'hardhat'
import {
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} from '@mesonfi/sdk/src'
import { MockToken, MesonPoolsTest } from '@mesonfi/contract-types'
import { expect } from '../shared/expect'
import { initiator, provider } from '../shared/wallet'
import { fixtures, TOKEN_BALANCE } from '../shared/fixtures'
import { getDefaultSwap } from '../shared/meson'

describe('MesonClient', () => {
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
    userClient = await MesonClient.Create(result.pools, new EthersWalletSwapSigner(initiator))
    mesonInstance = result.pools.connect(provider) // provider is signer
    lpClient = await MesonClient.Create(mesonInstance)
    outChain = lpClient.shortCoinType
    await token.approve(mesonInstance.address, 1000)
  })

  describe('#depositAndRegister', () => {
    it('rejects negative amount', async () => {
      let amount: string = '-100'
      let providerIndex: string = '1'
      try {
        await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      } catch (error) {
        expect(error.reason).to.equal("value out-of-bounds")
      }
    })
    it('rejects zero amount', async () => {
      let amount: string = '0'
      let providerIndex: string = '1'
      try {
        await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if amount overflow', async () => {
      try {
        let value: Number = 10 * 1000 * 1000 * 1000
        let amount: string = value.toString()
        let providerIndex: string = '1'
        await lpClient.depositAndRegister(lpClient.token(1), amount, '1')
      } catch (error) {
        expect(error.reason).to.throw
      }
    })
    it('rejects the amount if no enough appove', async () => {
      try {
        let amount: string = '1000000'
        let providerIndex: string = '1'
        await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects Index already registered', async () => {
      try {
        let amount: string = '1000'
        let amount2: string = '10'
        let providerIndex: string = '1'
        await lpClient.depositAndRegister(lpClient.token(1), amount, '1')
        await lpClient.depositAndRegister(lpClient.token(1), amount2, providerIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if provider index is zero', async () => {
      let amount: string = '1000'
      let providerIndex: string = '0'
      try {
        await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if the address is already registered', async () => {
      let amount: string = '100'
      let providerIndex: string = '1'
      try {
        await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
        await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if the index is already registered', async () => {
      let amount: string = '1000'
      let providerIndex: string = '1'
      try {
        await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('refuses unsupported token', async () => {
      let amount: string = '1000'
      let providerIndex: string = '1'
      try {
        let s = await lpClient.depositAndRegister(lpClient.token(2), amount, providerIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the depoit if all parameters are correct', async () => {
      let amount: string = '1000'
      let providerIndex: string = '1'
      await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      expect(await mesonInstance.balanceOf(lpClient.token(1), provider.address)).to.equal(amount)
      expect(await token.balanceOf(mesonInstance.address)).to.equal(amount)
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE.sub(amount))
    })
  })

  describe('#deposit', () => {
    it('rejects negative  amount', async () => {
      let amount: string = '100'
      let amount2: string = '-1'
      let providerIndex: string = '1'
      try {
        await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
        await lpClient.deposit(lpClient.token(1), amount2)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects zero amount ', async () => {
      let amount: string = '100'
      let amount2: string = '0'
      let providerIndex: string = '1'
      try {
        await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
        await lpClient.deposit(lpClient.token(1), amount2)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if amount overflow', async () => {
      let value: Number = 2 ** 256 + 1
      let amount: string = value.toString()
      let amount2: string = '10'
      let providerIndex: string = '1'
      try {
        await lpClient.depositAndRegister(lpClient.token(1), amount2, providerIndex)
        await lpClient.deposit(lpClient.token(1), amount)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects the amount if no enough appove', async () => {
      try {
        let amount: string = '100'
        let amount2: string = '1000'
        let providerIndex: string = '1'
        await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
        await lpClient.deposit(lpClient.token(1), amount2)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the depoit if all parameters are correct', async () => {
      let amount: string = '10'
      let amount2: string = '10'
      let providerIndex: string = '1'
      await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      await lpClient.deposit(lpClient.token(1), amount2)
      expect(await mesonInstance.balanceOf(lpClient.token(1), provider.address)).to.equal(20)
      expect(await token.balanceOf(mesonInstance.address)).to.equal(20)
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE.sub(20))
    })
  })

  describe('#lock', async () => {
    it('rejects swap  already exists', async () => {
      let amount: string = '100'
      let providerIndex: string = '1'
      await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      const swap = userClient.requestSwap(getDefaultSwap(), outChain)
      const request = await swap.signForRequest()
      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      await lpClient.lock(signedRequest)
      try {
        await lpClient.lock(signedRequest)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it(' rejects caller not registered', async () => {
      const swap = userClient.requestSwap(getDefaultSwap(), outChain)
      const request = await swap.signForRequest()
      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      try {
        await lpClient.lock(signedRequest)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the lock if all parameters are correct', async () => {
      await lpClient.depositAndRegister(lpClient.token(1), '1000', '1')
      const swap = userClient.requestSwap(getDefaultSwap(), outChain)
      const request = await swap.signForRequest()
      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      await lpClient.lock(signedRequest)
      expect(await mesonInstance.balanceOf(lpClient.token(1), initiator.address)).to.equal(0)
    })
  })

  describe('#unlock', async () => {
    it('rejects swap  does not exist', async () => {
      let amount: string = '1000'
      let providerIndex: string = '1'
      await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      const swap = userClient.requestSwap(getDefaultSwap({ inToken:10}), outChain)
      const request = await swap.signForRequest()
      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      try {
        await lpClient.unlock(signedRequest)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects swap still in lock', async () => {
      let amount: string = '1000'
      let providerIndex: string = '1'
      await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      const swap = userClient.requestSwap(getDefaultSwap(), outChain)
      const request = await swap.signForRequest()
      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      await lpClient.lock(signedRequest)
      try {
        await lpClient.unlock(signedRequest)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the depoit if all parameters are correct', async () => {
      //How to test ？The time requirement is 30 minutes later
    })
  })

  describe('#release', async () => {
    it('Swap not for this chain', async () => {
      let amount: string = '100'
      let providerIndex: string = '1'
      await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      const swapData = getDefaultSwap()
      const swap = userClient.requestSwap(swapData, outChain)
      const request = await swap.signForRequest()
      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      await lpClient.lock(signedRequest)
      const swap2 = userClient.requestSwap(swapData, "0x02ca")
      const release = await swap2.signForRelease(swapData.recipient)
      const signedRelease = new SignedSwapRelease(release)
      signedRelease.checkSignature()
      try {
        await lpClient.release(signedRelease)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects swap does not exist', async () => {
      let amount: string = '100'
      let providerIndex: string = '1'
      await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      const swapData = getDefaultSwap()
      const swap = userClient.requestSwap(swapData, outChain)
      const request = await swap.signForRequest()
      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      await lpClient.lock(signedRequest)
      const swapData2 = getDefaultSwap({ inToken:10})
      const swap2 = userClient.requestSwap(swapData2, outChain)
      const release = await swap2.signForRelease(swapData2.recipient)
      const signedRelease = new SignedSwapRelease(release)
      signedRelease.checkSignature()
      try {
        await lpClient.release(signedRelease)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the depoit if all parameters are correct', async () => {
      let amount: string = '1000'
      let providerIndex: string = '1'
      await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)

      const swapData = getDefaultSwap()
      const swap = userClient.requestSwap(swapData, outChain)
      const request = await swap.signForRequest()

      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      await lpClient.lock(signedRequest)

      const release = await swap.signForRelease(swapData.recipient)
      const signedRelease = new SignedSwapRelease(release)
      signedRelease.checkSignature()
      await lpClient.release(signedRelease)

      expect(await mesonInstance.balanceOf(lpClient.token(1), initiator.address)).to.equal(0)
      expect(await token.balanceOf(swapData.recipient)).to.equal(swap.amount)
    })
  })

  describe('#withdraw', () => {
    it('rejects Caller not registered', async () => {
      let amount: string = '1000'
      let providerIndex: string = '1'
      try {
        await mesonInstance.withdraw(amount, providerIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if amount overflow', async () => {
      let amount: string = '1000'
      let amount2: string = '1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      let providerIndex: string = '1'
      await lpClient.depositAndRegister(lpClient.token(1), amount, providerIndex)
      try {
        await mesonInstance.withdraw(amount2, 1)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the depoit if all parameters are correct', async () => {
      await lpClient.depositAndRegister(lpClient.token(1), '1000', '1')
      await mesonInstance.withdraw('1000', 1)
      expect(await token.balanceOf(mesonInstance.address)).to.equal(0)
      expect(await token.balanceOf(provider.address)).to.equal(TOKEN_BALANCE)
    })
  })

  describe('#requestSwap', () => {
    it('rejects No swap signer assigned', async () => {
      const result = await waffle.loadFixture(() => fixtures([
        initiator.address, provider.address
      ]))
      userClient = await MesonClient.Create(result.pools)
      try {
        await userClient.requestSwap(getDefaultSwap(), outChain)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts return SwapWithSigner', async () => {
      const result = await waffle.loadFixture(() => fixtures([
        initiator.address, provider.address
      ]))
      mesonInstance = result.pools.connect(provider) // provider is signer
      userClient = await MesonClient.Create(result.pools, new EthersWalletSwapSigner(initiator))
      const swap = userClient.requestSwap(getDefaultSwap(), outChain)
      expect(await swap.inChain).to.equal(outChain)
      expect(await swap.amount).to.equal(getDefaultSwap().amount)
      expect(await swap.inToken).to.equal(getDefaultSwap().inToken)
      expect(await swap.outChain).to.equal(outChain)
      expect(await swap.outToken).to.equal(getDefaultSwap().outToken)
      expect(await swap.salt).not.to.equal(getDefaultSwap().salt)
    })
  })

  describe('#postSwap', () => {
    it('rejects  call depositAndRegister first.', async () => {
      const swapData = getDefaultSwap()
      const swap = userClient.requestSwap(swapData, outChain)
      const request = await swap.signForRequest()
      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      try {
        await userClient.postSwap(signedRequest)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the postSwap if all parameters are correct', async () => {
      const result = await waffle.loadFixture(() => fixtures([
        initiator.address, provider.address
      ]))
      token = result.token1.connect(initiator)
      mesonInstance = result.swap // default account is signer
    
      userClient = await MesonClient.Create(mesonInstance, new EthersWalletSwapSigner(initiator)) // user is default account
      lpClient = await MesonClient.Create(mesonInstance.connect(provider))
  
      await lpClient.mesonInstance.register(1)
      const swap = userClient.requestSwap(getDefaultSwap({ fee: '0' }), outChain)
      const request = await swap.signForRequest()

      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      await token.approve(mesonInstance.address, swap.amount)
      await lpClient.postSwap(signedRequest)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(initiator.address)
      expect(posted.provider).to.equal(provider.address)
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(swap.amount))
    })
  })

  describe('#getPostedSwap', () => {
    it('rejects Invalid encoded.', async () => {
      const result = await waffle.loadFixture(() => fixtures([
        initiator.address, provider.address
      ]))
      token = result.token1.connect(initiator)
      mesonInstance = result.swap // default account is signer
    
      userClient = await MesonClient.Create(mesonInstance, new EthersWalletSwapSigner(initiator)) // user is default account
      lpClient = await MesonClient.Create(mesonInstance.connect(provider))
  
      await lpClient.mesonInstance.register(1)
      const swap = userClient.requestSwap(getDefaultSwap({ fee: '0' }), outChain)
      const request = await swap.signForRequest()

      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      await token.approve(mesonInstance.address, swap.amount)
      await lpClient.postSwap(signedRequest)
  
      const posted = await mesonInstance.getPostedSwap(swap.encoded+'bad')
      expect(posted.initiator).to.equal('0x0000000000000000000000000000000000000000')
      expect(posted.provider).to.equal('0x0000000000000000000000000000000000000000')
    })
    it('accepts the getPostedSwap if all parameters are correct', async () => {
      const result = await waffle.loadFixture(() => fixtures([
        initiator.address, provider.address
      ]))
      token = result.token1.connect(initiator)
      mesonInstance = result.swap // default account is signer
    
      userClient = await MesonClient.Create(mesonInstance, new EthersWalletSwapSigner(initiator)) // user is default account
      lpClient = await MesonClient.Create(mesonInstance.connect(provider))
  
      await lpClient.mesonInstance.register(1)
      const swap = userClient.requestSwap(getDefaultSwap({ fee: '0' }), outChain)
      const request = await swap.signForRequest()

      const signedRequest = new SignedSwapRequest(request)
      signedRequest.checkSignature()
      await token.approve(mesonInstance.address, swap.amount)
      await lpClient.postSwap(signedRequest)

      const posted = await mesonInstance.getPostedSwap(swap.encoded)
      expect(posted.initiator).to.equal(initiator.address)
      expect(posted.provider).to.equal(provider.address)
      expect(await token.balanceOf(initiator.address)).to.equal(TOKEN_BALANCE.sub(swap.amount))
    })
  })

})
