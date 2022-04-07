const { ethers } = require('hardhat')
const { ERC20, Meson } = require('@mesonfi/contract-abis')

require('dotenv').config()

const { NETWORK_ID, LP_PRIVATE_KEY } = process.env
const networkId = NETWORK_ID === 'eth' ? 'ropsten' : NETWORK_ID

const amount = '100000'

async function main() {
  const testnets = require('@mesonfi/presets/src/testnets.json')
  const index = testnets.findIndex(item => item.id.startsWith(networkId))
  if (index === -1) {
    throw new Error(`Invalid network: ${networkId}`)
  }

  const testnet = testnets[index]
  hre.changeNetwork(testnet.id)

  const wallet = new ethers.Wallet(LP_PRIVATE_KEY, ethers.provider)

  const token1 = new ethers.Contract(testnet.tokens[0].addr, ERC20.abi, wallet)
  const token2 = new ethers.Contract(testnet.tokens[1].addr, ERC20.abi, wallet)
  const meson = new ethers.Contract(testnet.mesonAddress, Meson.abi, wallet)

  console.log(`lp address: ${wallet.address}`)

  console.log(`approving for ${amount}...`)
  await (await token1.approve(testnet.mesonAddress, ethers.utils.parseUnits(amount, 18))).wait(1)
  await (await token2.approve(testnet.mesonAddress, ethers.utils.parseUnits(amount, 18))).wait(1)

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
  await tx.wait(1)

  const balanceIndex2 = 2 * 2**40 + providerIndex
  const tx2 = await meson.deposit(ethers.utils.parseUnits(amount, 6), balanceIndex2)
  console.log(tx2)
}

main()
