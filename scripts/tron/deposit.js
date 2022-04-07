const TronWeb = require('tronweb')
const { ethers } = require('ethers')
const { Meson, ERC20 } = require('@mesonfi/contract-abis')

const tronWeb = new TronWeb({
  fullHost: 'https://api.nileex.io',
  privateKey: process.env.LP_PRIVATE_KEY
})

const usdt = 'TFa74kDVGad7Lhwe2cwqgUQQY6D65odv2t'
const usdc = 'TWpuhvz3tivwoQcm16kzaChAZHv2QRGcm5'
const meson = 'TYtGRRt9ZcAtYEEVG4B5vGuxAWsrQ2WTFo'

const amount = ethers.utils.parseUnits('50000', 6)
const lpIndex = 3

async function deposit() {
  const usdtContract = tronWeb.contract(ERC20.abi, usdt)
  const usdcContract = tronWeb.contract(ERC20.abi, usdc)
  const mesonContract = tronWeb.contract(Meson.abi, meson)

  await usdtContract.approve(meson, amount).send()
  await usdcContract.approve(meson, amount).send()
  await new Promise(resolve => setInterval(resolve, 1000))

  await mesonContract.depositAndRegister(amount, 2**40 + lpIndex).send()
  await new Promise(resolve => setInterval(resolve, 1000))
  await mesonContract.deposit(amount, 2 * 2**40 + lpIndex).send()

  // await mesonContract.withdraw(amount, 1).send()
  // await mesonContract.withdraw(amount, 2).send()
}

deposit()
