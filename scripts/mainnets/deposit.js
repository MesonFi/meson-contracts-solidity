const { ethers } = require('hardhat')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')
const { ERC20, Meson } = require('@mesonfi/contract-abis')

require('dotenv').config()

const { HARDHAT_NETWORK, LP_PRIVATE_KEY } = process.env

const amount = '100000'
const tokenIndex = 1

const mainnets = require('@mesonfi/presets/src/mainnets.json')
const network = mainnets.find(item => item.id === HARDHAT_NETWORK)
ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)

const wallet = new ethers.Wallet(LP_PRIVATE_KEY, ethers.provider)

main()

async function main() {
  const tokenAddr = tokenIndex === 255 ? network.mesonToken : network.tokens.find(t => t.tokenIndex === tokenIndex).addr
  const token = new ethers.Contract(tokenAddr, ERC20.abi, wallet)
  const meson = new ethers.Contract(network.mesonAddress, Meson.abi, wallet)

  console.log(`lp address: ${wallet.address}`)

  const tx = await deposit(meson, token)
  // const tx = await withdraw(meson, token, '')
  console.log(tx)
}

async function deposit (meson, token) {
  console.log(`approving for ${amount}...`)
  const decimals = await token.decimals()
  await (await token.approve(network.mesonAddress, ethers.utils.parseUnits(amount, decimals))).wait(1)

  console.log(`depositing for ${amount}...`)
  const providerIndex = await meson.indexOfAddress(wallet.address)
  const needRegister = providerIndex == 0
  const balanceIndex = tokenIndex * 2**40 + (needRegister ? 1 : providerIndex)

  if (needRegister) {
    return await meson.depositAndRegister(ethers.utils.parseUnits(amount, 6), balanceIndex)
  } else {
    return await meson.deposit(ethers.utils.parseUnits(amount, 6), balanceIndex)
  }
}

async function withdraw (meson, token, recipient) {
  const decimals = await token.decimals()
  console.log(`withdrawing for ${amount}...`)
  await (await meson.withdraw(ethers.utils.parseUnits(amount, 6), tokenIndex)).wait()
  if (recipient) {
    return await token.transfer(recipient, ethers.utils.parseUnits(amount, decimals))
  }
}
