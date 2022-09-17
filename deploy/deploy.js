const { ethers } = require('hardhat')
const getNetworkWallet = require('../scripts/lib/getNetworkWallet')
const { deployContract, deployMeson } = require('../scripts/lib/deploy')
const { deposit } = require('../scripts/lib/pool')
const updatePresets = require('../scripts/lib/updatePresets')

require('dotenv').config()

const {
  HARDHAT_NETWORK,
  PRIVATE_KEY,
  PREMIUM_MANAGER,
  UPGRADABLE = false,
  DEPOSIT_ON_DEPLOY
} = process.env

module.exports = async function deploy() {
  const { network, wallet } = getNetworkWallet(PRIVATE_KEY)
  const tokens = network.tokens

  if (!HARDHAT_NETWORK) { // only for testnets
    for await (const token of tokens) {
      console.log(`Deploying ${token.name}...`)
      const totalSupply = ethers.utils.parseUnits('1000000', token.decimals)
      const args = [token.name, token.symbol, totalSupply.toString(), token.decimals]
      const tokenContract = await deployContract('MockToken', wallet, args)
      token.addr = tokenContract.address
    }
  }

  const meson = await deployMeson(wallet, UPGRADABLE, PREMIUM_MANAGER, tokens)
  network.mesonAddress = meson.address

  const shortCoinType = await meson.getShortCoinType()
  if (shortCoinType !== network.shortSlip44) {
    throw new Error('Coin type does not match')
  }

  if (!HARDHAT_NETWORK && DEPOSIT_ON_DEPLOY) { // only for testnets
    for await(const token of tokens) {
      await deposit(token.symbol, DEPOSIT_ON_DEPLOY, { network, wallet })
    }
  }

  network.tokens = tokens
  updatePresets(network)
}
