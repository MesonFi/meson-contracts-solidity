const { ethers, upgrades } = require('hardhat')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')
const UCTUpgradeable = require('../../artifacts/contracts/Token/UCTUpgradeable.sol/UCTUpgradeable.json')

require('dotenv').config()

const { HARDHAT_NETWORK, PRIVATE_KEY, MINTER, MINTER_PK } = process.env

const mainnets = require('@mesonfi/presets/src/mainnets.json')
const index = mainnets.findIndex(item => item.id === HARDHAT_NETWORK)
const network = mainnets[index]

async function deploy() {
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  const UCT = await ethers.getContractFactory('UCTUpgradeable', wallet)
  console.log('Deploying UCT...')
  const uct = await upgrades.deployProxy(UCT, [MINTER], { kind: 'uups' })
  await uct.deployed()
  console.log('UCT deployed to:', uct.address)
}

async function upgrade() {
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  const UCT = await ethers.getContractFactory('UCTUpgradeable', wallet)
  console.log('Upgrading UCT...')
  await upgrades.upgradeProxy(network.uctAddress, UCT)
}

async function mint(targets, amount) {
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
  const wallet = new ethers.Wallet(MINTER_PK, ethers.provider)

  const uct = new ethers.Contract(network.uctAddress, UCTUpgradeable.abi, wallet)
  const tx = await uct.batchMint(targets, ethers.utils.parseUnits(amount, 4))
  await tx.wait()
}

async function mint2(targets, amounts) {
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
  const wallet = new ethers.Wallet(MINTER_PK, ethers.provider)

  const uct = new ethers.Contract(network.uctAddress, UCTUpgradeable.abi, wallet)
  const tx = await uct.batchMint2(targets, amounts)
  await tx.wait()
}

async function batchMint(amount) {
  for (i = 0; i < 1500; i += 500) {
    const parts = targets.slice(i, i + 500)
    if (!parts.length) {
      return
    }
    console.log(`minting to ${i}-${i + 500}`)
    await mint(parts, amount)
    console.log(`minted`)
  }
}

// const core = require('./core.json')
const list = require('./cashback.json')
// const targets = list.filter(addr => ethers.utils.isAddress(addr))
mint([], '100')
// mint2(list.map(i => i.address), list.map(i => i.cashback))