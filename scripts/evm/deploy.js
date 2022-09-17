const { ethers } = require('hardhat')
const switchNetwork = require('./lib/switchNetwork')
const { deployMeson, deployMesonUpgradable } = require('./lib/deploy')
const { deposit } = require('./lib/pool')
const updatePresets = require('./lib/updatePresets')

require('dotenv').config()

const {
  HARDHAT_NETWORK,
  PRIVATE_KEY,
  PREMIUM_MANAGER,
  UPGRADABLE = false,
  DEPOSIT_ON_DEPLOY
} = process.env

async function main() {
  const network = switchNetwork()
  const tokens = network.tokens

  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  if (!HARDHAT_NETWORK) { // only for testnets
    const MockToken = await ethers.getContractFactory('MockToken', wallet)
    for await (const token of tokens) {
      const totalSupply = ethers.utils.parseUnits('1000000', token.decimals)
      console.log(`Deploying ${token.name}...`)
      const tokenContract = await MockToken.deploy(token.name, token.symbol, totalSupply, token.decimals)
      await tokenContract.deployed()
      token.addr = tokenContract.address
      console.log(`${token.name} deployed to:`, token.addr)
    }
  }

  const deployer = UPGRADABLE ? deployMesonUpgradable : deployMeson
  const meson = await deployer(wallet, PREMIUM_MANAGER, tokens)
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

main()
