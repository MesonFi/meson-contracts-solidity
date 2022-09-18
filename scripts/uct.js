const { ethers, upgrades } = require('hardhat')
const { getWallet, getContract } = require('../lib/adaptor')
const UCTUpgradeable = require('../../../artifacts/contracts/Token/UCTUpgradeable.sol/UCTUpgradeable.json')

require('dotenv').config()

const { PRIVATE_KEY, MINTER, MINTER_PK } = process.env

async function deploy(network) {
  const wallet = getWallet(network, PRIVATE_KEY)
  const UCT = await ethers.getContractFactory('UCTUpgradeable', wallet)
  console.log('Deploying UCT...')
  const uct = await upgrades.deployProxy(UCT, [MINTER, network.mesonAddress], { kind: 'uups' })
  await uct.deployed()
  console.log('UCT deployed to:', uct.address)
}

async function upgrade(network) {
  const wallet = getWallet(network, PRIVATE_KEY)
  const UCT = await ethers.getContractFactory('UCTUpgradeable', wallet)
  console.log('Upgrading UCT...')
  await upgrades.upgradeProxy(network.uctAddress, UCT)
}

async function mint(network, targets, amount) {
  const wallet = getWallet(network, MINTER_PK)

  const uct = getContract(network.uctAddress, UCTUpgradeable.abi, wallet)
  const tx = await uct.batchMint(targets, ethers.utils.parseUnits(amount, 4))
  await tx.wait()
}

async function mint2(network, targets, amounts) {
  const wallet = getWallet(network, MINTER_PK)

  const uct = getContract(network.uctAddress, UCTUpgradeable.abi, wallet)
  const tx = await uct.batchMint2(targets, amounts)
  await tx.wait()
}

async function batchMint(network, amount) {
  for (i = 0; i < 1500; i += 500) {
    const parts = targets.slice(i, i + 500)
    if (!parts.length) {
      return
    }
    console.log(`minting to ${i}-${i + 500}`)
    await mint(network, parts, amount)
    console.log(`minted`)
  }
}

// const core = require('./core.json')
const list = require('./data/cashback.json')
// const targets = list.filter(addr => ethers.utils.isAddress(addr))
mint([], '100')
// mint2(list.map(i => i.address), list.map(i => i.cashback))