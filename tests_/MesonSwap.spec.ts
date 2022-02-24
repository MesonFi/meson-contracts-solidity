const { ethers, upgrades, waffle } = require('hardhat')
import { initiator, provider } from './shared/wallet'
import { getDefaultSwap } from './shared/meson'
import {
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease
} from '@mesonfi/sdk/src'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { expect } from './shared/expect'
import { pack } from '@ethersproject/solidity'
describe('MesonSwap', () => {
  let totalSupply = 1000000000000
  let mesonContract;
  let tokenContract;
  let tokenUsdcContract;
  let mesonFactory;
  let userClient: MesonClient
  let signedRequest
  let outChain
  let swap
  let swapData
  let lpClient: MesonClient
  let over={
    gasLlimit:70000,
    gasPrice: 50000000000
  }
  describe('MesonSwap', () => {
    beforeEach('deploy MesonSwapTest', async () => {
      const MockToken = await ethers.getContractFactory('MockToken')
      tokenContract = await MockToken.deploy('Mock Token Usdt', 'MUsdt', totalSupply)
      await tokenContract.deployed()
      tokenUsdcContract = await MockToken.deploy('Mock Token Usdc', 'MUsdc', totalSupply)
      await tokenUsdcContract.deployed()
      mesonFactory = await ethers.getContractFactory('UpgradableMeson')
      mesonContract = await upgrades.deployProxy(mesonFactory, [[tokenContract.address, tokenUsdcContract.address]], { kind: 'uups' })
      await mesonContract.deployed()
      let approve = await tokenContract.approve(mesonContract.address, 1000)
      await approve
      userClient = await MesonClient.Create(mesonContract, new EthersWalletSwapSigner(initiator))
      outChain = await mesonContract.getShortCoinType()
      swap = userClient.requestSwap(getDefaultSwap(), outChain)
      const request = await swap.signForRequest()
      signedRequest = new SignedSwapRequest(request)
      swapData = getDefaultSwap()
    })

    // describe('#postSwap', () => {
    //   it('rejects Swap already exists', async () => {
    //     let providerIndex: string = '1'
    //     try {
    //       await mesonContract.postSwap(
    //         signedRequest.encoded,
    //         signedRequest.signature[0],
    //         signedRequest.signature[1],
    //         signedRequest.signature[2],
    //         pack(['address', 'uint40'], [
    //           signedRequest.initiator,
    //           providerIndex
    //         ])
    //       )
    //     } catch (error) {
    //       console.log(error)
    //        expect(error).to.throw
    //     }
    //   })
      // it('rejects expire ts too early', async () => {
      //   let balanceIndex = 0x010000000001
      //   let amount = 100
      //   let providerIndex: string = '1'
      //   await mesonContract.depositAndRegister(amount, balanceIndex)
      //   try {
      //     await mesonContract.postSwap(
      //       signedRequest.encoded,
      //       signedRequest.signature[0],
      //       signedRequest.signature[1],
      //       signedRequest.signature[2],
      //       pack(['address', 'uint40'], [
      //         signedRequest.initiator,
      //         providerIndex
      //       ])
      //     )
      //   } catch (error) {
      //     console.log(error)
      //      expect(error).to.throw
      //   }
      // })
      // it('rejects expire ts too late ', async () => {
      //   //expect check delta = MAX_BOND_TIME_PERIOD
      // })
      // it('rejects  expire ts too late ', async () => {
      //   //expect check delta < MAX_BOND_TIME_PERIOD
      // })
      // it('refuses unsupported token', async () => {
      //   //expect check token
      // })
      // it('accepts  the postSwap if all parameters are correct', async () => {

      //   // expect(posted.initiator).to.equal(initiator.address)
      //   // expect(posted.provider).to.equal(provider.address)

      // })
    // })



    describe('#bondSwap', () => {
      it('accepts  bondSwap', async () => {
      let balanceIndex = 0x010000000001
        let amount = 100
        let providerIndex: string = '1'
        userClient = await MesonClient.Create(mesonContract, new EthersWalletSwapSigner(initiator)) // user is default account
        lpClient = await MesonClient.Create(mesonContract.connect(provider))
        await mesonContract.depositAndRegister(amount, balanceIndex)
        const swap = userClient.requestSwap(getDefaultSwap({ fee: '0' }), outChain)
        const request = await swap.signForRequest()
        const signedRequest = new SignedSwapRequest(request)
        await lpClient.postSwap(signedRequest)
        // await mesonContract.bondSwap(signedRequest.encoded,providerIndex,over)
      })
      // it('rejects swap does not exist ', async () => {
      //   let providerIndex: string = '1'
      //   await mesonContract.bondSwap(signedRequest.encoded,providerIndex)
      // })
    })

      // describe('#executeSwap', () => {
      //   it('accepts executeSwap', async () => {
      //     //expect check  postedSwap != 0
      //   })
      //   it('rejects swap does not exist', async () => {
      //     //expect check  postedSwap == 0
      //   })
      // })

  

      // describe('#cancelSwap', () => {
      //   it('accepts postedSwap', async () => {
      //     //expect check  postedSwap > 1
      //   })
      //   it('rejects Swap does not exist ', async () => {
      //     //expect check postedSwap < 1
      //   })
      // })
  })
})