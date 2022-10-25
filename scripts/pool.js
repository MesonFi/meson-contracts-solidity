const { adaptors } = require('@mesonfi/sdk')
const { getClient } = require('./lib/getClient')
const { deposit, withdraw, send, authorize } = require('./lib/pool')

require('dotenv').config()

const { LP_PRIVATE_KEY } = process.env

const amount = '10'
const symbol = 'USDC'
const addr = ''

module.exports = async function pool(network) {
  const client = getClient(network)

  const wallet = adaptors.getWallet(LP_PRIVATE_KEY, client)
  console.log(`LP address: ${await wallet.getAddress()}`)
  
  const tx = await deposit(symbol, amount, { network, wallet })
  // const tx = await withdraw(symbol, amount, { network, wallet })
  // const tx = await send(symbol, amount, addr, { network, wallet })
  // const tx = await authorize(addr)
  console.log(tx)
}
