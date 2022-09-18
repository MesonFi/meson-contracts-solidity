const { ethers } = require('hardhat')
const TronWeb = require('tronweb')
const { getWallet, deployContract, getContract } = require('./lib/adaptor')
const updatePresets = require('./lib/updatePresets')

require('dotenv').config()

const {
  ZKSYNC,
  PRIVATE_KEY,
  MINTER,
  MINTER_PK
} = process.env

module.exports = async function uct(network) {
  // await deploy(network)
  // await upgrade(network)

  // await mint(network, [], '100')

  // const list = require('./data/cashback.json')
  // await mint2(network, list.map(i => i.address), list.map(i => i.cashback))
}

async function deploy(network) {
  if (network.id.startsWith('zksync') && !ZKSYNC) {
    throw new Error('Need to set environment variable ZKSYNC=true for zksync')
  }

  const wallet = getWallet(network, PRIVATE_KEY)
  console.log('Deploying UCTUpgradeable...')
  const impl = await deployContract('UCTUpgradeable', wallet)
  console.log('Deploying Proxy...')
  const data = impl.interface.encodeFunctionData('initialize', [MINTER, TronWeb.address.toHex(network.mesonAddress).replace(/^(41)/, '0x')])
  const proxy = await deployContract('ERC1967Proxy', wallet, [impl.address, data])

  network.uctAddress = proxy.address
  updatePresets(network)
}

async function upgrade(network) {
  if (network.id.startsWith('zksync') && !ZKSYNC) {
    throw new Error('Need to set environment variable ZKSYNC=true for zksync')
  }

  const wallet = getWallet(network, PRIVATE_KEY)

  console.log('Deploying UCTUpgradeable...')
  const impl = await deployContract('UCTUpgradeable', wallet)
  const abi = JSON.parse(impl.interface.format('json'))
  const proxy = getContract(network.uctAddress, abi, wallet)
  await proxy.upgradeTo(impl.address)
  console.log('UCTUpgradeable upgraded')
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
