const { adaptor } = require('@mesonfi/sdk')
const { getProvider } = require('./lib/getProvider')
const { deposit, withdraw, send } = require('./lib/pool')

require('dotenv').config()

const { LP_PRIVATE_KEY } = process.env

const amount = '10'
const symbol = 'USDC'
const recipient = ''

module.exports = async function pool(network) {
  const provider = getProvider(network)

  const wallet = adaptor.getWallet(LP_PRIVATE_KEY, provider)
  console.log(`LP address: ${await wallet.getAddress()}`)
  
  const tx = await deposit(symbol, amount, { network, wallet })
  // const tx = await withdraw(symbol, amount, { network, wallet })
  // const tx = await send(symbol, amount, recipient, { network, wallet })
  console.log(tx)
}
