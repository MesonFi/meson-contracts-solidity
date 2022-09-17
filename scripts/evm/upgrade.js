const { ethers, upgrades } = require('hardhat')
const switchNetwork = require('./lib/switchNetwork')

require('dotenv').config()

const { PRIVATE_KEY } = process.env

async function main() {
  const network = switchNetwork()

  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  // TODO
  // const UpgradableMeson = await ethers.getContractFactory('UpgradableMeson', wallet)
  // console.log('Upgrading UpgradableMeson...')
  // await upgrades.upgradeProxy(network.mesonAddress, UpgradableMeson)
  // console.log('UpgradableMeson upgraded')
}

main()
