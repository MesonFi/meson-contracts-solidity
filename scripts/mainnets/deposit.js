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
  const tokenAddr = tokenIndex === 255 ? network.uctAddress : network.tokens.find(t => t.tokenIndex === tokenIndex).addr
  const token = new ethers.Contract(tokenAddr, ERC20.abi, wallet)
  const meson = new ethers.Contract(network.mesonAddress, Meson.abi, wallet)

  console.log(`lp address: ${wallet.address}`)

  // const tx = await wallet.sendTransaction({
  //   value: ethers.utils.parseEther('0.1'),
  //   to: ''
  // })

  const tx = await deposit(meson, token)
  // const tx = await withdraw(meson, token, '')
  console.log(tx)
}

async function deposit (meson, token) {
  const decimals = await token.decimals()
  const value = ethers.utils.parseUnits(amount, decimals)
  const allowance = await token.allowance(wallet.address, network.mesonAddress)
  console.log(`allowance: ${ethers.utils.formatUnits(allowance, decimals)}`)
  if (allowance.lt(value)) {
    console.log(`approving...`)
    await (await token.approve(network.mesonAddress, ethers.utils.parseUnits('1000000000000', decimals))).wait(1)
  }

  console.log(`depositing for ${amount}...`)
  const poolIndex = await meson.poolOfPermissionedAddr(wallet.address)
  const needRegister = poolIndex == 0
  const poolTokenIndex = tokenIndex * 2**40 + (needRegister ? 1 : poolIndex)

  if (needRegister) {
    return await meson.depositAndRegister(ethers.utils.parseUnits(amount, 6), poolTokenIndex)
  } else {
    return await meson.deposit(ethers.utils.parseUnits(amount, 6), poolTokenIndex)
  }
}

async function withdraw (meson, token, recipient) {
  const decimals = await token.decimals()
  console.log(`withdrawing for ${amount}...`)
  const gasLimit = await meson.estimateGas.withdraw(ethers.utils.parseUnits(amount, 6), tokenIndex)
  await (await meson.withdraw(ethers.utils.parseUnits(amount, 6), tokenIndex, { gasLimit })).wait()
  if (recipient) {
    return await token.transfer(recipient, ethers.utils.parseUnits(amount, decimals))
  }
}
