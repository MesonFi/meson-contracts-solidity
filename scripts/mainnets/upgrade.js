const { ethers, upgrades } = require('hardhat')
require('dotenv').config()

const { NETWORK_ID, PRIVATE_KEY } = process.env

async function main() {
  const mainnets = require('@mesonfi/presets/src/mainnets.json')
  const network = mainnets.find(item => item.id === NETWORK_ID)
  hre.changeNetwork(network.id)

  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  const UpgradableMeson = await ethers.getContractFactory('UpgradableMeson', wallet)
  console.log('Upgrading UpgradableMeson...')
  await upgrades.upgradeProxy(network.mesonAddress, UpgradableMeson);
  console.log('UpgradableMeson upgraded')
}

main()
