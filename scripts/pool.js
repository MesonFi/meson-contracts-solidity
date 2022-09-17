const { ethers } = require('hardhat')
const getNetworkWallet = require('./lib/getNetworkWallet')
const { deposit, withdraw, send } = require('./lib/pool')

require('dotenv').config()

const { LP_PRIVATE_KEY } = process.env

const amount = '10'
const symbol = 'USDC'
const recipient = ''

async function main() {
  const { network, wallet } = getNetworkWallet(LP_PRIVATE_KEY)
  console.log(`LP address: ${wallet.address}`)
  
  const tx = await deposit(symbol, amount, { network, wallet })
  // const tx = await withdraw(symbol, amount, { network, wallet })
  // const tx = await send(symbol, amount, recipient, { network, wallet })
  console.log(tx)
}

main()
