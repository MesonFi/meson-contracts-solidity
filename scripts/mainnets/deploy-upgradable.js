const path = require('path')
const fs = require('fs')
const { ethers, upgrades } = require('hardhat')
require('dotenv').config()

const { NETWORK_ID, PRIVATE_KEY } = process.env

async function main() {
  const mainnets = require('@mesonfi/presets/src/mainnets.json')
  const index = mainnets.findIndex(item => item.id === NETWORK_ID)
  const network = mainnets[index]
  hre.changeNetwork(network.id)

  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)
  const tokens = network.tokens
    .filter(t => t.symbol.startsWith('USDC'))
    .map(t => t.addr)

  const UpgradableMeson = await ethers.getContractFactory('UpgradableMeson', wallet)
  console.log('Deploying UpgradableMeson...')
  const meson = await upgrades.deployProxy(UpgradableMeson, [tokens], { kind: 'uups' })
  await meson.deployed()
  console.log('UpgradableMeson deployed to:', meson.address)

  const shortCoinType = await meson.getShortCoinType()
  if (shortCoinType !== network.shortSlip44) {
    throw new Error('Coin type does not match')
  }

  network.mesonAddress = meson.address
  mainnets.splice(index, 1, network)
  const mainnetsPath = path.join(__dirname, '../../packages/presets/src/mainnets.json')
  fs.writeFileSync(mainnetsPath, JSON.stringify(mainnets, null, 2))
}

main()
