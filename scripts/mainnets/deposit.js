const { ethers, upgrades } = require('hardhat')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')
const { ERC20, Meson } = require('@mesonfi/contract-abis')

require('dotenv').config()

const { HARDHAT_NETWORK, LP_PRIVATE_KEY } = process.env

const amount = 'AMOUNT_TO_DEPOSIT'

async function main() {
  const mainnets = require('@mesonfi/presets/src/mainnets.json')
  const network = mainnets.find(item => item.id === HARDHAT_NETWORK)
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)

  const wallet = new ethers.Wallet(LP_PRIVATE_KEY, ethers.provider)

  const usdc = new ethers.Contract(network.tokens[0].addr, ERC20.abi, wallet)
  const meson = new ethers.Contract(network.mesonAddress, Meson.abi, wallet)

  const providerIndex = await meson.indexOfAddress(wallet.address)
  const balanceIndex = 2**40 + providerIndex
  console.log(`provider index: ${providerIndex}, balance index: ${balanceIndex}`)

  console.log(`approving for ${amount}...`)
  await (await usdc.approve(network.mesonAddress, amount)).wait(1)

  console.log(`depositing for ${amount}...`)
  const tx = await meson.deposit(amount, balanceIndex)
  // const tx = await meson.depositAndRegister(amount, balanceIndex)
  console.log(tx)
}

main()
