const { getWallet } = require('./lib/adaptor')
const { deposit, withdraw, send } = require('./lib/pool')

require('dotenv').config()

const { LP_PRIVATE_KEY } = process.env

const amount = '10'
const symbol = 'USDC'
const recipient = ''

module.exports = async function pool(network) {
  const wallet = getWallet(network, LP_PRIVATE_KEY)
  console.log(`LP address: ${wallet.address}`)
  
  const tx = await deposit(symbol, amount, { network, wallet })
  // const tx = await withdraw(symbol, amount, { network, wallet })
  // const tx = await send(symbol, amount, recipient, { network, wallet })
  console.log(tx)
}
