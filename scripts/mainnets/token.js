const { ethers, upgrades } = require('hardhat')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')
const MesonToken = require('../../artifacts/contracts/Token/MesonTokenUpgradeable.sol/MesonTokenUpgradeable.json')

require('dotenv').config()

const { PRIVATE_KEY, MINTER, MINTER_PK } = process.env

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
  await upgrades.upgradeProxy('0xF24B060bdF1cc97Ce104971553fb81A186e79Ee6', MesonTokenUpgradeable)
}

async function mint() {
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
  const wallet = new ethers.Wallet(MINTER_PK, ethers.provider)

  const mesonToken = new ethers.Contract('0xF24B060bdF1cc97Ce104971553fb81A186e79Ee6', MesonToken.abi, wallet)
  await mesonToken.batchMint(['0x243f22fbd4C375581aaACFCfff5A43793eb8A74d'], '10000000')
}

mint()
