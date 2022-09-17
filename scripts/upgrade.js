const { ethers, upgrades } = require('hardhat')
const getNetworkWallet = require('./lib/getNetworkWallet')

require('dotenv').config()

const { PRIVATE_KEY } = process.env

async function main() {
  const { network, wallet } = getNetworkWallet(PRIVATE_KEY)

  // TODO
  // const UpgradableMeson = await ethers.getContractFactory('UpgradableMeson', wallet)
  // console.log('Upgrading UpgradableMeson...')
  // await upgrades.upgradeProxy(network.mesonAddress, UpgradableMeson)
  // console.log('UpgradableMeson upgraded')
}

main()
