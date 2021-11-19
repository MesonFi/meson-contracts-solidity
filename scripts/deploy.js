const { ethers } = require('hardhat')

const token = '0x243f22fbd4c375581aaacfcfff5a43793eb8a74d'

async function main() {
  const Meson = await ethers.getContractFactory('Meson')
  console.log('Deploying Meson...')
  const deployed = await Meson.deploy(token)
  console.log('Meson deployed to:', deployed.address)
}

main()
