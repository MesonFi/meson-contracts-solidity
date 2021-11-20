const { ethers, upgrades } = require('hardhat')

const token = '0x243f22fbd4c375581aaacfcfff5a43793eb8a74d'

async function main() {
  const Meson = await ethers.getContractFactory('Meson')
  console.log('Deploying Meson...')
  const meson = await upgrades.deployProxy(Meson, [token], { kind: 'uups' })
  await meson.deployed()
  console.log('Meson deployed to:', meson.address)
}

main()
