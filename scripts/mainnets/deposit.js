const { ethers } = require('hardhat')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')
const { ERC20, Meson } = require('@mesonfi/contract-abis')

require('dotenv').config()

const { HARDHAT_NETWORK, LP_PRIVATE_KEY } = process.env

const amount = '1000'

async function main() {
  const mainnets = require('@mesonfi/presets/src/mainnets.json')
  const network = mainnets.find(item => item.id === HARDHAT_NETWORK)
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)

  const wallet = new ethers.Wallet(LP_PRIVATE_KEY, ethers.provider)

  const token1 = new ethers.Contract(network.tokens[0].addr, ERC20.abi, wallet)
  const meson = new ethers.Contract(network.mesonAddress, Meson.abi, wallet)

  console.log(`lp address: ${wallet.address}`)

  console.log(`approving for ${amount}...`)
  await (await token1.approve(network.mesonAddress, ethers.utils.parseUnits(amount, 18))).wait(1)

  console.log(`depositing for ${amount}...`)
  const providerIndex = await meson.indexOfAddress(wallet.address)
  const needRegister = providerIndex == 0
  const balanceIndex = 2**40 + (needRegister ? 1 : providerIndex)

  let tx
  if (needRegister) {
    tx = await meson.depositAndRegister(ethers.utils.parseUnits(amount, 6), balanceIndex)
  } else {
    tx = await meson.deposit(ethers.utils.parseUnits(amount, 6), balanceIndex)
  }
  console.log(tx)
}

main()
