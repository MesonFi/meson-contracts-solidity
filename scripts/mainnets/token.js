const { ethers, upgrades } = require('hardhat')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')
const MesonToken = require('../../artifacts/contracts/Token/MesonTokenUpgradeable.sol/MesonTokenUpgradeable.json')

require('dotenv').config()

const { HARDHAT_NETWORK, PRIVATE_KEY, MINTER, MINTER_PK } = process.env

const mainnets = require('@mesonfi/presets/src/mainnets.json')
const index = mainnets.findIndex(item => item.id === HARDHAT_NETWORK)
const network = mainnets[index]

async function deploy() {
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  const MesonTokenUpgradeable = await ethers.getContractFactory('MesonTokenUpgradeable', wallet)
  console.log('Deploying MesonTokenUpgradeable...')
  const mesonToken = await upgrades.deployProxy(MesonTokenUpgradeable, [MINTER], { kind: 'uups' })
  await mesonToken.deployed()
  console.log('UpgradableMeson deployed to:', mesonToken.address)
}

async function upgrade() {
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  const MesonTokenUpgradeable = await ethers.getContractFactory('MesonTokenUpgradeable', wallet)
  console.log('Upgrading MesonTokenUpgradeable...')
  await upgrades.upgradeProxy(network.mesonToken, MesonTokenUpgradeable)
}

async function mint() {
  const amount = '1000'

  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
  const wallet = new ethers.Wallet(MINTER_PK, ethers.provider)

  const mesonToken = new ethers.Contract(network.mesonToken, MesonToken.abi, wallet)
  await mesonToken.batchMint(['0x243f22fbd4C375581aaACFCfff5A43793eb8A74d'], ethers.utils.parseUnits(amount, 4))
}

mint()
