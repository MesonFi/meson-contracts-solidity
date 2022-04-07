const { ethers, upgrades } = require('hardhat')
require('dotenv').config()

const { NETWORK_ID, PRIVATE_KEY } = process.env
const networkId = NETWORK_ID === 'eth' ? 'ropsten' : NETWORK_ID

async function main() {
  const testnets = require('@mesonfi/presets/src/testnets.json')
  const network = testnets.find(item => item.id.startsWith(networkId))
  hre.changeNetwork(network.id)

  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  const UpgradableMeson = await ethers.getContractFactory('UpgradableMeson', wallet)
  console.log('Upgrading UpgradableMeson...')
  await upgrades.upgradeProxy(network.mesonAddress, UpgradableMeson)
  console.log('UpgradableMeson upgraded')
}

main()
