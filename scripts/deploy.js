const { ethers } = require('hardhat')
const { adaptors } = require('@mesonfi/sdk')
const { getAdaptor } = require('./lib/getAdaptor')
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
  const adaptor = getAdaptor(network)
  await hre.run('compile')

  if (upgradable && network.id.startsWith('skale')) {
    upgradable = 2 // deploy Proxy2ToMeson
  }

  const wallet = adaptors.getWallet(PRIVATE_KEY, adaptor)
  const tokens = network.tokens

  if (testnetMode) { // only for testnets
    for (const token of tokens) {
      if (token.addr) {
        continue
      }

      console.log(`Deploying ${token.name}...`)
      const totalSupply = ethers.utils.parseUnits('100000000', token.decimals)
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
    for (const token of tokens) {
      await deposit(token.tokenIndex, DEPOSIT_ON_DEPLOY, { network, wallet })
    }
  }

  network.tokens = tokens
  updatePresets(network)
}
