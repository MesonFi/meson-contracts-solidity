const { ethers } = require('hardhat')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')

require('dotenv').config()

const { PRIVATE_KEY } = process.env

async function main() {
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  const RefundApp = await ethers.getContractFactory('SampleThirdPartyDapp', wallet)
  console.log('Deploying RefundApp...')
  const refundApp = await RefundApp.deploy()
  await refundApp.deployed()
  console.log('RefundApp deployed to:', refundApp.address)
}

main()
