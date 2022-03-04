const path = require('path')
const fs = require('fs')
const { ethers, upgrades } = require('hardhat')
const { MesonClient } = require('@mesonfi/sdk/src')
require('dotenv').config()

const { NETWORK_ID, PRIVATE_KEY, DEPOSIT_ON_DEPLOY } = process.env

async function main() {
  const testnets = require('@mesonfi/presets/src/testnets.json')
  const index = testnets.findIndex(item => item.id.startsWith(NETWORK_ID))
  if (index === -1) {
    throw new Error(`Invalid network: ${NETWORK_ID}`)
  }

  const testnet = testnets[index]
  hre.changeNetwork(testnet.id)

  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)
  const MockToken = await ethers.getContractFactory('MockToken', wallet)

  const tokens = []
  for await(const token of testnet.tokens) {
    const totalSupply = ethers.utils.parseUnits('1000000', token.decimals)
    console.log(`Deploying ${token.name}...`)
    const tokenContract = await MockToken.deploy(token.name, token.symbol, totalSupply, token.decimals)
    await tokenContract.deployed()
    token.addr = tokenContract.address
    tokens.push({ ...token, contract: tokenContract })
    console.log(`${token.name} deployed to:`, token.addr)
  }

  const UpgradableMeson = await ethers.getContractFactory('UpgradableMeson', wallet)
  console.log('Deploying UpgradableMeson...')
  const meson = await upgrades.deployProxy(
    UpgradableMeson,
    [tokens.map(t => t.addr)],
    { kind: 'uups' }
  )
  await meson.deployed()
  console.log('UpgradableMeson deployed to:', meson.address)

  const mesonClient = await MesonClient.Create(meson)

  if (mesonClient.shortCoinType !== testnet.shortSlip44) {
    throw new Error('Coin type does not match')
  }

  let needRegister = true
  if (DEPOSIT_ON_DEPLOY) {
    for await(const token of tokens) {
      const value = ethers.utils.parseUnits(DEPOSIT_ON_DEPLOY, token.decimals)
      const valueForMeson = ethers.utils.parseUnits(DEPOSIT_ON_DEPLOY, 6)
      console.log(`Approving and depositing ${DEPOSIT_ON_DEPLOY} ${token.symbol} to Meson...`)
      await (await token.contract.approve(meson.address, value)).wait(1)
      if (needRegister) {
        await (await mesonClient.depositAndRegister(token.addr, valueForMeson, 1)).wait(1)
        needRegister = false
      } else {
        await (await mesonClient.deposit(token.addr, valueForMeson)).wait(1)
      }
      console.log(`${DEPOSIT_ON_DEPLOY} ${token.symbol} deposited`)
    }
  }

  testnet.mesonAddress = meson.address
  testnets.splice(index, 1, testnet)
  const testnetsPath = path.join(__dirname, '../../packages/presets/src/testnets.json')
  fs.writeFileSync(testnetsPath, JSON.stringify(testnets, null, 2))
}

main()
