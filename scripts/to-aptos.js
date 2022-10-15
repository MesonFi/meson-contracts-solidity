const {
  adaptor,
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} = require('@mesonfi/sdk/src')
const { Meson } = require('@mesonfi/contract-abis')

const { Wallet, utils } = require('ethers')

const { getProvider } = require('./lib/getProvider')
const { getPartialSwap } = require('../test/shared/meson')

require('dotenv').config()

const {
  PRIVATE_KEY, // initiator
  LP_PRIVATE_KEY,
  APTOS_LP_PRIVATE_KEY,
  APTOS_USER_PRIVATE_KEY,
} = process.env

module.exports = async function toAptos(network, aptosNetwork) {
  const provider = getProvider(network)

  const wallet = adaptor.getWallet(LP_PRIVATE_KEY, provider)
  console.log(`LP address (${network.id}): ${await wallet.getAddress()}`)
  console.log(`Balance: ${(await wallet.getBalance()).toString()}`)

  const mesonInstance = adaptor.getContract(network.mesonAddress, Meson.abi, wallet)
  const swapSigner = new EthersWalletSwapSigner(new Wallet(PRIVATE_KEY))
  const mesonClient = await MesonClient.Create(mesonInstance, swapSigner)

  const aptos = getProvider(aptosNetwork)
  const aptosLpWallet = adaptor.getWallet(APTOS_LP_PRIVATE_KEY, aptos)
  const aptosUserWallet = adaptor.getWallet(APTOS_USER_PRIVATE_KEY, aptos)
  console.log(`Aptos LP address: ${await aptosLpWallet.getAddress()}`)
  console.log(`Balance: ${(await aptosLpWallet.getBalance()).toString()}`)

  const aptosMesonInstance = adaptor.getContract(aptosNetwork.mesonAddress, Meson.abi, aptosLpWallet)
  const aptosLpMesonClient = await MesonClient.Create(aptosMesonInstance)
  const aptosUserMesonClient = await MesonClient.Create(aptosMesonInstance.connect(aptosUserWallet))

  const amount = utils.parseUnits('1', 6)
  const swapData = getPartialSwap({ amount, inToken: 1, outToken: 2 })
  const outChain = await aptosMesonInstance.getShortCoinType()
  const swap = mesonClient.requestSwap(swapData, outChain)
  const request = await swap.signForRequest(true) // will be signed by swapSigner (user)
  const signedRequest = new SignedSwapRequest(request)

  const tx1 = await mesonClient.postSwap(signedRequest) // will be posted by lp
  console.log(`posted: \t${network.explorer}/tx/${tx1.hash}`)

  const tx2 = await aptosLpMesonClient.lock(signedRequest) // will be posted by aptos lp
  console.log(`locked: \t${aptosNetwork.explorer}/txn/${tx2.hash}`)

  await tx1.wait()
  await tx2.wait()


  const recipient = adaptor.getWallet(APTOS_USER_PRIVATE_KEY, provider)
  const recipientAddress = await recipient.getAddress()
  const release = await swap.signForRelease(recipientAddress, true) // will be signed by swapSigner (user)
  const signedRelease = new SignedSwapRelease(release)

  const tx3 = await mesonClient.executeSwap(signedRelease) // will be posted by lp
  console.log(`executed: \t${network.explorer}/tx/${tx3.hash}`)

  const tx4 = await aptosUserMesonClient.release(signedRelease) // will be posted by aptos user
  console.log(`released: \t${aptosNetwork.explorer}/txn/${tx4.hash}`)
}
