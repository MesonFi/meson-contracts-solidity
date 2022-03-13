const { ethers, upgrades } = require('hardhat')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')

require('dotenv').config()

const { HARDHAT_NETWORK, PRIVATE_KEY } = process.env

async function main() {
  const mainnets = require('@mesonfi/presets/src/mainnets.json')
  const network = mainnets.find(item => item.id === HARDHAT_NETWORK)
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)

  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  const UpgradableMeson = await ethers.getContractFactory('UpgradableMeson', wallet)
  console.log('Upgrading UpgradableMeson...')
  await upgrades.upgradeProxy(network.mesonAddress, UpgradableMeson)
  console.log('UpgradableMeson upgraded')
}

main()
