const { ethers, upgrades } = require('hardhat')

const address = '0x'

async function main() {
  const Meson = await ethers.getContractFactory('UpgradableMeson')
  console.log('Upgrading Meson...')
  const upgraded = await upgrades.upgradeProxy(address, Meson);
  console.log('Meson upgraded')
}

main()
