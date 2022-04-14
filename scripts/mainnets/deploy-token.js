const { ethers, upgrades } = require('hardhat')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')

require('dotenv').config()

const { PRIVATE_KEY, MINTER } = process.env

async function main() {
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  const MesonTokenUpgradeable = await ethers.getContractFactory('MesonTokenUpgradeable', wallet)
  console.log('Deploying MesonTokenUpgradeable...')
  const mesonToken = await upgrades.deployProxy(MesonTokenUpgradeable, [MINTER], { kind: 'uups' })
  await mesonToken.deployed()
  console.log('UpgradableMeson deployed to:', mesonToken.address)
}

main()
