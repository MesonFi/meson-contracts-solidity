const { ethers, upgrades, waffle } = require('hardhat')
import { initiator, provider } from './shared/wallet'
import { getDefaultSwap } from './shared/meson'
import {
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease
} from '@mesonfi/sdk/src'
import { keccak256 } from '@ethersproject/keccak256'
import { fixtures, TOKEN_BALANCE } from './shared/fixtures'
import { expect } from './shared/expect'
import { pack } from '@ethersproject/solidity'
// import { UpgradableMeson__factory } from '../packages/contract-types'
import { UpgradableMeson__factory } from '../packages/contract-types/types/index'
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
  const testnetMode = true
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
      const request = await swap.signForRequest(testnetMode)
      signedRequest = new SignedSwapRequest(request)
      swapData = getDefaultSwap()
    })

    describe('#postSwap', () => {
      it('rejects Swap already exists', async () => {
        let balanceIndex = 0x010000000001
        let amount = 100
        let providerIndex: string = '1'
        await mesonContract.depositAndRegister(amount, balanceIndex)
        await mesonContract.postSwap(
          signedRequest.encoded,
          signedRequest.signature[0],
          signedRequest.signature[1],
          signedRequest.signature[2],
          pack(['address', 'uint40'], [
            signedRequest.initiator,
            providerIndex
          ])
        )
        try {
          await mesonContract.postSwap(
            signedRequest.encoded,
            signedRequest.signature[0],
            signedRequest.signature[1],
            signedRequest.signature[2],
            pack(['address', 'uint40'], [
              signedRequest.initiator,
              providerIndex
            ])
          )
        } catch (error) {
          expect(error).to.match(/Swap already exists/)
        }
      })
      it('rejects expire ts too early', async () => {
        //How to Change the expire time
      })
      it('rejects expire ts too late ', async () => {
        //expect check delta = MAX_BOND_TIME_PERIOD
      })
      it('rejects  expire ts too late ', async () => {
        //expect check delta < MAX_BOND_TIME_PERIOD
      })
      it('expect For security reason, amount cannot be greater than 100k', async () => {
        let balanceIndex = 0x010000000001
        let amount = 1000000000000
        let providerIndex: string = '1'
        let approve = await tokenContract.approve(mesonContract.address, amount)
        await approve
        console.log(await tokenContract.balanceOf(initiator.address))
        await mesonContract.depositAndRegister('100000000000', balanceIndex)
        swap = userClient.requestSwap(getDefaultSwap({ amount: '1000000000000' }), outChain)
        const request = await swap.signForRequest(testnetMode)
        signedRequest = new SignedSwapRequest(request)
        try {
          await mesonContract.postSwap(
            signedRequest.encoded,
            signedRequest.signature[0],
            signedRequest.signature[1],
            signedRequest.signature[2],
            pack(['address', 'uint40'], [
              signedRequest.initiator,
              providerIndex
            ])
          )
        } catch (error) {
          expect(error).to.match(/For security reason, amount cannot be greater than 100k/)
        }
      })
      it('accepts  the postSwap if all parameters are correct', async () => {
        let providerIndex: string = '1'
        await mesonContract.postSwap(
          signedRequest.encoded,
          signedRequest.signature[0],
          signedRequest.signature[1],
          signedRequest.signature[2],
          pack(['address', 'uint40'], [
            signedRequest.initiator,
            providerIndex
          ])
        )
        const getPostSwap = await mesonContract.getPostedSwap(signedRequest.encoded)
        expect(getPostSwap.initiator.toLowerCase()).to.equal(signedRequest.initiator)
        expect(getPostSwap.executed).to.be.false
      })
    })

    describe('#bondSwap', () => {
      it('accepts  bondSwap', async () => {
        //  let providerIndex: string = '1'
        //   await mesonContract.postSwap(
        //     signedRequest.encoded,
        //     signedRequest.signature[0],
        //     signedRequest.signature[1],
        //     signedRequest.signature[2],
        //     pack(['address', 'uint40'], [
        //       signedRequest.initiator,
        //       providerIndex
        //     ])
        //   )
        //   await mesonContract.bondSwap(signedRequest.encoded, providerIndex)
      })
      it('rejects swap does not exist ', async () => {
        try {
          let providerIndex: string = '1'
          await mesonContract.bondSwap(signedRequest.encoded + '1', providerIndex)
        } catch (error) {
          expect(error).to.match(/Swap does not exist/)
        }
      })
      it('rejects Swap bonded to another provider ', async () => {
        let providerIndex: string = '1'
        await mesonContract.postSwap(
          signedRequest.encoded,
          signedRequest.signature[0],
          signedRequest.signature[1],
          signedRequest.signature[2],
          pack(['address', 'uint40'], [
            signedRequest.initiator,
            providerIndex
          ])
        )
        try {
          await mesonContract.bondSwap(signedRequest.encoded, providerIndex)
        } catch (error) {
          expect(error).to.match(/Swap bonded to another provider/)
        }
      })
      it('rejects  Can only bound to signer', async () => {
        //   let contract = new ethers.Contract(mesonContract.address, UpgradableMeson__factory.abi, provider);
        //   let providerIndex: string = '3'
        //   await mesonContract.postSwap(
        //     signedRequest.encoded,
        //     signedRequest.signature[0],
        //     signedRequest.signature[1],
        //     signedRequest.signature[2],
        //     pack(['address', 'uint40'], [
        //       signedRequest.initiator,
        //       providerIndex
        //     ])
        //   )
        //   try {
        //     await contract.bondSwap(signedRequest.encoded, providerIndex, over)
        //   } catch (error) {
        //     console.log(error)
        //     expect(error).to.match(/Can only bound to signer/)
        //   }
      })
    })
    describe('#executeSwap', () => {
      it('accepts executeSwap', async () => {
        // let providerIndex: string = '1'
        // const swapData = getDefaultSwap({ fee: '0' })
        // const swap = userClient.requestSwap(swapData, outChain)
        // const request = await swap.signForRequest(testnetMode)
        // const signedRequest = new SignedSwapRequest(request)
        // signedRequest.checkSignature(testnetMode)
        // await mesonContract.postSwap(
        //   signedRequest.encoded,
        //   signedRequest.signature[0],
        //   signedRequest.signature[1],
        //   signedRequest.signature[2],
        //   pack(['address', 'uint40'], [
        //     signedRequest.initiator,
        //     providerIndex
        //   ])
        // )
        // const release = await swap.signForRelease(swapData.recipient, testnetMode)
        // const signedRelease = new SignedSwapRelease(release)
        // signedRelease.checkSignature(testnetMode)
        // await mesonContract.executeSwap(
        //   signedRelease.encoded,
        //   keccak256(signedRelease.recipient),
        //   ...signedRelease.signature,
        //   false
        // )
      })
      it('rejects swap does not exist', async () => {
        const release = await swap.signForRelease(swapData.recipient, testnetMode)
        const signedRelease = new SignedSwapRelease(release)
        signedRelease.checkSignature(testnetMode)
        try {
          await mesonContract.executeSwap(
            signedRelease.encoded + '1',
            keccak256(signedRelease.recipient),
            ...signedRelease.signature,
            false
          )
        } catch (error) {
          expect(error).to.match(/Swap does not exist/)
        }
      })
    })

    describe('#cancelSwap', () => {
      it('accepts cancelSwap', async () => {
        //How to cancelswap It takes 30 minutes to unlock and then cancel
      })
      it('rejects Swap does not exist ', async () => {
        await mesonContract.postSwap(
          signedRequest.encoded,
          signedRequest.signature[0],
          signedRequest.signature[1],
          signedRequest.signature[2],
          pack(['address', 'uint40'], [
            signedRequest.initiator,
            '1'
          ])
        )
        try {
          await mesonContract.cancelSwap(signedRequest.encoded + '1')
        } catch (error) {
          expect(error).to.match(/Swap does not exist/)
        }
      })
      it('rejects  Swap is still locked ', async () => {
        const swapData = getDefaultSwap({ fee: '0' })
        const swap = userClient.requestSwap(swapData, outChain)
        const request = await swap.signForRequest(testnetMode)
        const signedRequest = new SignedSwapRequest(request)
        signedRequest.checkSignature(testnetMode)
        await mesonContract.postSwap(
          signedRequest.encoded,
          signedRequest.signature[0],
          signedRequest.signature[1],
          signedRequest.signature[2],
          pack(['address', 'uint40'], [
            signedRequest.initiator,
            '1'
          ])
        )
        try {
          await mesonContract.cancelSwap(signedRequest.encoded)
        } catch (error) {
          expect(error).to.match(/Swap is still locked/)
        }
      })
    })
  })
})