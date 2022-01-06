const path = require('path')
const fs = require('fs')
const { ethers } = require('hardhat')
const mainnets = require('../packages/presets/src/mainnets.json')
const testnets = require('../packages/presets/src/testnets.json')

const networkId = process.env.NETWORK_ID
const wallet = new ethers.Wallet(privateKey, ethers.provider)

async function main() {
  const network = mainnets.find(item => item.id === networkId)
  if (!network) {
    throw new Error(`Invalid network: ${networkId}`)
  }

  const index = testnets.findIndex(item => item.slip44 === network.slip44)
  if (index === -1) {
    throw new Error(`Invalid network: ${networkId}`)
  }

  const testnet = testnets[index]

  const MockToken = await ethers.getContractFactory('MockToken', wallet)
  const nonce = await ethers.provider.getTransactionCount(wallet.address)
  const tokens = []
  let name, symbol
  
  name = `${testnet.alias} USDT`
  symbol = `${networkId[0]}USDT`
  console.log(`Deploying ${name}...`)
  const mockUSDT = await MockToken.deploy(name, symbol, ethers.utils.parseUnits('1000000', 6), { nonce })
  tokens.push({ addr: mockUSDT.address, name, symbol, decimals: 6 })
  console.log(`${name} deployed to:`, mockUSDT.address)

  name = `${testnet.alias} USDC`
  symbol = `${networkId[0]}USDC`
  console.log(`Deploying ${name}...`)
  const mockUSDC = await MockToken.deploy(name, symbol, ethers.utils.parseUnits('1000000', 6), { nonce: nonce + 1 })
  tokens.push({ addr: mockUSDC.address, name, symbol, decimals: 6 })
  console.log(`${name} deployed to:`, mockUSDC.address)

  const Meson = await ethers.getContractFactory('Meson', wallet)
  console.log('Deploying Meson...')
  const meson = await Meson.deploy([mockUSDT.address, mockUSDC.address], { nonce: nonce + 2 })
  console.log('Meson deployed to:', meson.address)

  testnet.mesonAddress = meson.address
  testnet.tokens = tokens
  testnets.splice(index, 1, testnet)
  const testnetsPath = path.join(__dirname, '../packages/presets/src/testnets.json')
  fs.writeFileSync(testnetsPath, JSON.stringify(testnets, null, 2))
}

main()
