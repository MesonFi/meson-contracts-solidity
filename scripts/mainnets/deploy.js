const path = require('path')
const fs = require('fs')
const { ethers } = require('hardhat')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')

require('dotenv').config()

const { HARDHAT_NETWORK, PRIVATE_KEY } = process.env

async function main() {
  const mainnets = require('@mesonfi/presets/src/mainnets.json')
  const index = mainnets.findIndex(item => item.id === HARDHAT_NETWORK)
  const network = mainnets[index]
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)

  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)
  const tokens = network.tokens

  const Meson = await ethers.getContractFactory('Meson', wallet)
  console.log('Deploying Meson...')
  const meson = await Meson.deploy(tokens.map(t => t.addr), tokens.map(t => t.tokenIndex))
  await meson.deployed()
  console.log('Meson deployed to:', meson.address)

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
