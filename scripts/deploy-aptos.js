const { FaucetClient } = require('aptos')
const { utils } = require('ethers')
const { adaptor } = require('@mesonfi/sdk')
const { Meson } = require('@mesonfi/contract-abis')

const { getProvider } = require('./lib/getProvider')
const { deployAptosContract } = require('./lib/deploy')
const updatePresets = require('./lib/updatePresets')

require('dotenv').config()

const {
  APTOS_PRIVATE_KEY,
  APTOS_LP_PRIVATE_KEY,
  DEPOSIT_ON_DEPLOY
} = process.env

const FAUCET_URL = 'https://faucet.devnet.aptoslabs.com'

exports.prepare = async function prepare(aptosNetwork) {
  const aptos = getProvider(aptosNetwork)
  const wallet = adaptor.getWallet(undefined, aptos)

  const key = wallet.signer.toPrivateKeyObject()

  const faucetClient = new FaucetClient(aptosNetwork.url, FAUCET_URL)
  await faucetClient.fundAccount(wallet.signer.address(), 1 * 1e8)

  console.log(key)

  const bal = await wallet.getBalance(await wallet.getAddress())
  console.log(`Balance: ${bal.toString()}`)
}

exports.deployAptos = async function deployAptos(aptosNetwork) {
  const aptos = getProvider(aptosNetwork)
  const wallet = adaptor.getWallet(APTOS_PRIVATE_KEY, aptos)

  const bal = await wallet.getBalance(await wallet.getAddress())
  console.log(`Balance: ${bal.toString()}`)

  // const tokens = aptosNetwork.tokens
  // await deployAptosContract('MesonCoins', wallet)

  aptosNetwork.mesonAddress = await wallet.getAddress()
  const mesonInstance = adaptor.getContract(aptosNetwork.mesonAddress, Meson.abi, wallet)

  const shortCoinType = await mesonInstance.getShortCoinType()
  if (shortCoinType !== aptosNetwork.shortSlip44) {
    throw new Error('Coin type does not match')
  }

  for (const module of ['MesonPools', 'MesonSwap', 'MesonStates']) {
    await (await mesonInstance.initializeTable(module, 1)).wait()
    await (await mesonInstance.initializeTable(module, 2)).wait()
  }

  if (DEPOSIT_ON_DEPLOY) {
    const lp = adaptor.getWallet(APTOS_LP_PRIVATE_KEY, aptos)
    const mesonWithLp = mesonInstance.connect(lp)
    for (const token of aptosNetwork.tokens) {
      await (await mesonWithLp.depositAndRegister(
        utils.parseUnits(DEPOSIT_ON_DEPLOY, 6),
        token.tokenIndex * 2**40 + 1
      )).wait()
    }
  }

  updatePresets(aptosNetwork)
}
