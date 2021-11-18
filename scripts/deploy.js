const { ethers, upgrades } = require('hardhat')

async function main() {
  const Meson = await ethers.getContractFactory('Meson')
  console.log('Deploying Meson...')
  const meson = await upgrades.deployProxy(Meson)
  await meson.deployed()
  console.log('Meson deployed to:', meson.address)
}

main()
