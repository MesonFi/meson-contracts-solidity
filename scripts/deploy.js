const { ethers } = require('hardhat')

async function main() {
  const Meson = await ethers.getContractFactory('Meson')
  console.log('Deploying Meson...')
  const deployed = await Meson.deploy()
  console.log('Meson deployed to:', deployed.address)
}

main()
