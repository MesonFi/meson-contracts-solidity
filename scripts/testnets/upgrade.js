const { ethers, upgrades } = require('hardhat')
const mainnets = require('@mesonfi/presets/src/mainnets.json')
const testnets = require('@mesonfi/presets/src/testnets.json')
require('dotenv').config()

const { NETWORK_ID, PRIVATE_KEY } = process.env

async function main() {
  const network = mainnets.find(item => item.id === NETWORK_ID)
  if (!network) {
    throw new Error(`Invalid network: ${NETWORK_ID}`)
  }

  const index = testnets.findIndex(item => item.slip44 === network.slip44)
  if (index === -1) {
    throw new Error(`Invalid network: ${NETWORK_ID}`)
  }

  const testnet = testnets[index]
  hre.changeNetwork(testnet.id)

  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  const UpgradableMeson = await ethers.getContractFactory('UpgradableMeson', wallet)
  console.log('Upgrading UpgradableMeson...')
  await upgrades.upgradeProxy(testnet.mesonAddress, UpgradableMeson);
  console.log('UpgradableMeson upgraded')
}

main()
