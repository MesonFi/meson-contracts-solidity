const { ethers } = require('hardhat')
const TronWeb = require('tronweb')
const { adaptors } = require('@mesonfi/sdk')
const { Meson } = require('@mesonfi/contract-abis')

const { getAdaptor } = require('./lib/getAdaptor')
const { deployContract } = require('./lib/deploy')
const updatePresets = require('./lib/updatePresets')
const PoDUpgradeable = require('../artifacts/contracts/Token/PoDUpgradeable.sol/PoDUpgradeable.json')
const UCTUpgradeable = require('../artifacts/contracts/Token/UCTUpgradeable.sol/UCTUpgradeable.json')

require('dotenv').config()

const {
  PRIVATE_KEY,
  MINTER,
  MINTER_PK
} = process.env

module.exports = async function uct(network) {
  await deploy(network)
  // await deployPoD(network)
  // await addUCT(network)

  // await upgrade(network)

  // await mint(network, [], '100')
  // await mintPoD(network, '', '100')

  // const list = require('./data/list.json')
  // await mint2(network, list.map(i => i.to), list.map(i => i.amount))
}

async function deploy(network) {
  const adaptor = getAdaptor(network)
  const wallet = adaptors.getWallet(PRIVATE_KEY, adaptor)

  console.log('Deploying UCTUpgradeable...')
  const impl = await deployContract('UCTUpgradeable', wallet)
  console.log('Deploying Proxy...')
  const data = impl.interface.encodeFunctionData('initialize', [MINTER, TronWeb.address.toHex(network.mesonAddress).replace(/^(41)/, '0x')])
  const proxy = await deployContract('ERC1967Proxy', wallet, [impl.address, data])

  network.uctAddress = proxy.address
  updatePresets(network)
}

async function deployPoD(network) {
  const adaptor = getAdaptor(network)
  const wallet = adaptors.getWallet(PRIVATE_KEY, adaptor)

  console.log('Deploying PoDUpgradeable...')
  const impl = await deployContract('PoDUpgradeable', wallet)
  console.log('Deploying Proxy...')
  const data = impl.interface.encodeFunctionData('initialize', [MINTER, TronWeb.address.toHex(network.mesonAddress).replace(/^(41)/, '0x')])
  const proxy = await deployContract('ERC1967Proxy', wallet, [impl.address, data])

  network.tokens = [...network.tokens, {
    name: 'Proof of Deposit (meson.fi)',
    symbol: 'PoD',
    decimals: 6,
    addr: proxy.address,
    tokenIndex: 32
  }]
  updatePresets(network)
}

async function addUCT(network) {
  const adaptor = getAdaptor(network)
  const wallet = adaptors.getWallet(PRIVATE_KEY, adaptor)

  console.log('ADD UCT to Meson...')
  const meson = adaptors.getContract(network.mesonAddress, Meson.abi, wallet)
  await meson.addSupportToken(network.uctAddress, 255)
}

async function upgrade(network) {
  const adaptor = getAdaptor(network)
  const wallet = adaptors.getWallet(PRIVATE_KEY, adaptor)

  console.log('Deploying UCTUpgradeable...')
  const impl = await deployContract('UCTUpgradeable', wallet)
  const abi = JSON.parse(impl.interface.format('json'))
  const proxy = adaptors.getContract(network.uctAddress, abi, wallet)
  await proxy.upgradeTo(impl.address)
  console.log('UCTUpgradeable upgraded')
}

async function mint(network, targets, amount) {
  const adaptor = getAdaptor(network)
  const wallet = adaptors.getWallet(MINTER_PK, adaptor)

  const uct = adaptors.getContract(network.uctAddress, UCTUpgradeable.abi, wallet)
  const tx = await uct.batchMint(targets, ethers.utils.parseUnits(amount, 4))
  await tx.wait()
}

async function mint2(network, targets, amounts) {
  const adaptor = getAdaptor(network)
  const wallet = adaptors.getWallet(MINTER_PK, adaptor)

  const uct = adaptors.getContract(network.uctAddress, UCTUpgradeable.abi, wallet)
  const tx = await uct.batchMint2(targets, amounts)
  await tx.wait()
}

async function mintPoD(network, account, amount) {
  const adaptor = getAdaptor(network)
  const wallet = adaptors.getWallet(MINTER_PK, adaptor)

  const token = network.tokens.find(t => t.tokenIndex === 32)
  console.log(token)

  const uct = adaptors.getContract(token.addr, PoDUpgradeable.abi, wallet)
  const tx = await uct.mint(account, ethers.utils.parseUnits(amount, 6))
  await tx.wait()
}
