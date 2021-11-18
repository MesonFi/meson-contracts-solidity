const { ethers, upgrades } = require('hardhat')

async function main() {
  const Meson = await ethers.getContractFactory('Meson')
  console.log('Upgrading Meson...')
  ethers.getContractFactory
  const meson = await upgrades.upgradeProxy("0x72fC06Da6b6220Ab0A4e6eF28CD78AC5C8f3125A", Meson)
  await meson.deployed()
  console.log('Meson is upgraded at:', meson.address)
}

main()
