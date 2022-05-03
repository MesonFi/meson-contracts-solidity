const TronWeb = require('tronweb')
const { ethers } = require('ethers')
const { Meson, ERC20 } = require('@mesonfi/contract-abis')

const testnetMode = process.env.TESTNET_MODE
const fullHost = testnetMode ? 'https://api.nileex.io' : 'https://api.trongrid.io'
const tokens = testnetMode
  ? ['TFa74kDVGad7Lhwe2cwqgUQQY6D65odv2t', 'TWpuhvz3tivwoQcm16kzaChAZHv2QRGcm5']
  : ['TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t']
const meson = testnetMode ? 'TYtGRRt9ZcAtYEEVG4B5vGuxAWsrQ2WTFo' : 'TSpVXBLbkx5bxox4bRg1Up2e58mzCezQgf'

const tronWeb = new TronWeb({
  fullHost,
  privateKey: process.env.LP_PRIVATE_KEY
})

const amount = ethers.utils.parseUnits('9959.04', 6)
const tokenIndex = 1
const lpIndex = 1

async function deposit() {
  const tokenContract = tronWeb.contract(ERC20.abi, tokens[tokenIndex - 1])
  const mesonContract = tronWeb.contract(Meson.abi, meson)

  await tokenContract.approve(meson, amount).send()
  await new Promise(resolve => setInterval(resolve, 1000))

  // await mesonContract.depositAndRegister(amount, tokenIndex * 2**40 + lpIndex).send()
  await mesonContract.deposit(amount, tokenIndex * 2**40 + lpIndex).send()

  // await mesonContract.withdraw(amount, tokenIndex).send()
}

deposit()
