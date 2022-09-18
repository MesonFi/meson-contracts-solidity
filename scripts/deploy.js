const { ethers } = require('hardhat')
const { getWallet, deployContract } = require('./lib/adaptor')
const { deployMeson } = require('./lib/deploy')
const { deposit } = require('./lib/pool')
const updatePresets = require('./lib/updatePresets')

require('dotenv').config()

const {
  ZKSYNC,
  PRIVATE_KEY,
  PREMIUM_MANAGER,
  DEPOSIT_ON_DEPLOY,
} = process.env

module.exports = async function deploy(network, upgradable, testnetMode) {
  if (network.id.startsWith('zksync') && !ZKSYNC) {
    throw new Error('Need to set environment variable ZKSYNC=true for zksync')
  }
  await hre.run('compile')

  const wallet = getWallet(network, PRIVATE_KEY)
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
