const path = require('path')
const fs = require('fs')
const { ethers, upgrades } = require('hardhat')
const { MesonClient } = require('@mesonfi/sdk/src')
const mainnets = require('@mesonfi/presets/src/mainnets.json')
const testnets = require('@mesonfi/presets/src/testnets.json')
require('dotenv').config()

const { NETWORK_ID, PRIVATE_KEY, DEPOSIT_ON_DEPLOY } = process.env

async function main() {
  const network = mainnets.find(item => item.id === NETWORK_ID)
  if (!network) {
    throw new Error(`Invalid network: ${NETWORK_ID}`)
  }

  const index = testnets.findIndex(item => item.slip44 === network.slip44)
  if (index === -1) {
    throw new Error(`Invalid network: ${NETWORK_ID}`)
  }

  const testnet = testnets[index]
  hre.changeNetwork(testnet.id)

  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)
  const MockToken = await ethers.getContractFactory('MockToken', wallet)
  const nonce = await ethers.provider.getTransactionCount(wallet.address)
  const tokens = []
  const totalSupply = ethers.utils.parseUnits('1000000', 6)
  
  const usdt = {
    name: `${testnet.alias} USDT`,
    symbol: `${NETWORK_ID[0]}USDT`,
    decimals: 6
  }
  console.log(`Deploying ${usdt.name}...`)
  const mockUSDT = await MockToken.deploy(usdt.name, usdt.symbol, totalSupply, { nonce })
  await mockUSDT.deployed()
  usdt.addr = mockUSDT.address
  tokens.push(usdt)
  console.log(`${usdt.name} deployed to:`, mockUSDT.address)

  const usdc = {
    name: `${testnet.alias} USDC`,
    symbol: `${NETWORK_ID[0]}USDC`,
    decimals: 6
  }
  console.log(`Deploying ${usdc.name}...`)
  const mockUSDC = await MockToken.deploy(usdc.name, usdc.symbol, totalSupply, { nonce: nonce + 1 })
  await mockUSDC.deployed()
  usdc.addr = mockUSDC.address
  tokens.push(usdc)
  console.log(`${usdc.name} deployed to:`, mockUSDC.address)

  const UpgradableMeson = await ethers.getContractFactory('UpgradableMeson', wallet)
  console.log('Deploying UpgradableMeson...')
  const meson = await upgrades.deployProxy(
    UpgradableMeson,
    [[mockUSDT.address, mockUSDC.address]],
    { kind: 'uups', nonce: nonce + 2 }
  )
  await meson.deployed()
  console.log('UpgradableMeson deployed to:', meson.address)

  const mesonClient = await MesonClient.Create(meson)

  if (mesonClient.shortCoinType !== testnet.shortSlip44) {
    throw new Error('Coin type does not match')
  }

  if (DEPOSIT_ON_DEPLOY) {
    const depositAmount = ethers.utils.parseUnits(DEPOSIT_ON_DEPLOY, 6)

    console.log(`Approving and depositing ${depositAmount} ${usdt.symbol} to Meson...`)
    await (await mockUSDT.approve(meson.address, depositAmount)).wait(1)
    await (await mesonClient.depositAndRegister(mesonClient.token(1), depositAmount, 1)).wait(1)
    console.log(`${depositAmount} ${usdt.symbol} deposited`)

    console.log(`Approving and depositing ${depositAmount} ${usdc.symbol} to Meson...`)
    await (await mockUSDC.approve(meson.address, depositAmount)).wait(1)
    await (await mesonClient.deposit(mesonClient.token(2), depositAmount)).wait(1)
    console.log(`${depositAmount} ${usdc.symbol} deposited`)
  }

  testnet.mesonAddress = meson.address
  testnet.tokens = tokens
  testnets.splice(index, 1, testnet)
  const testnetsPath = path.join(__dirname, '../packages/presets/src/testnets.json')
  fs.writeFileSync(testnetsPath, JSON.stringify(testnets, null, 2))
}

main()
