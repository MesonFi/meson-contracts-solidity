const { ethers, upgrades } = require('hardhat')

const tokens = [
  '0xbff1e190dbe45d3d74d4f3d9624e740366063c28'
]

async function main() {
  const Meson = await ethers.getContractFactory('UpgradableMeson')
  console.log('Deploying UpgradableMeson...')
  const meson = await upgrades.deployProxy(Meson, [tokens], { kind: 'uups' })
  await meson.deployed()
  console.log('UpgradableMeson deployed to:', meson.address)
}

main()
