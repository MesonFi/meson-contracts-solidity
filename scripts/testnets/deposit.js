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
  const poolIndex = await meson.poolOfPermissionedAddr(wallet.address)
  const needRegister = poolIndex == 0
  const poolTokenIndex = 2**40 + (needRegister ? 1 : poolIndex)

  let tx
  if (needRegister) {
    tx = await meson.depositAndRegister(ethers.utils.parseUnits(amount, 6), poolTokenIndex)
  } else {
    tx = await meson.deposit(ethers.utils.parseUnits(amount, 6), poolTokenIndex)
  }
  console.log(tx)
  await tx.wait(1)

  const poolTokenIndex2 = 2 * 2**40 + poolIndex
  const tx2 = await meson.deposit(ethers.utils.parseUnits(amount, 6), poolTokenIndex2)
  console.log(tx2)
}

main()
