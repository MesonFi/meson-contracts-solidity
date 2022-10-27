const { ethers } = require('hardhat')
const { adaptors } = require('@mesonfi/sdk')
const { getClient } = require('./lib/getClient')
const { deployMeson, deployContract } = require('./lib/deploy')
const { deposit } = require('./lib/pool')
const updatePresets = require('./lib/updatePresets')

require('dotenv').config()

const {
  PRIVATE_KEY,
  PREMIUM_MANAGER,
  DEPOSIT_ON_DEPLOY,
} = process.env

module.exports = async function deploy(network, upgradable, testnetMode) {
  const client = getClient(network)
  await hre.run('compile')

  const wallet = adaptors.getWallet(PRIVATE_KEY, client)
  const tokens = network.tokens

  if (testnetMode) { // only for testnets
    for await (const token of tokens) {
      console.log(`Deploying ${token.name}...`)
      const totalSupply = ethers.utils.parseUnits('1000000', token.decimals)
      const args = [token.name, token.symbol, totalSupply.toString(), token.decimals]
      const tokenContract = await deployContract('MockToken', wallet, args)
      token.addr = tokenContract.address
    }
  }

  const meson = await deployMeson(wallet, upgradable, PREMIUM_MANAGER, tokens)
  network.mesonAddress = meson.address

  const shortCoinType = await meson.getShortCoinType()
  if (shortCoinType !== network.shortSlip44) {
    throw new Error('Coin type does not match')
  }

  if (testnetMode && DEPOSIT_ON_DEPLOY) { // only for testnets
    for await(const token of tokens) {
      await deposit(token.symbol, DEPOSIT_ON_DEPLOY, { network, wallet })
    }
  }

  network.tokens = tokens
  updatePresets(network)
}
