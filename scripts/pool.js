const { adaptor } = require('@mesonfi/sdk')
const { getProvider } = require('./lib/getProvider')
const { deposit, withdraw, send, authorize } = require('./lib/pool')

require('dotenv').config()

const { LP_PRIVATE_KEY } = process.env

const amount = '10'
const symbol = 'USDC'
const addr = ''

module.exports = async function pool(network) {
  const provider = getProvider(network)

  const wallet = adaptor.getWallet(LP_PRIVATE_KEY, provider)
  console.log(`LP address: ${await wallet.getAddress()}`)
  
  const tx = await deposit(symbol, amount, { network, wallet })
  // const tx = await withdraw(symbol, amount, { network, wallet })
  // const tx = await send(symbol, amount, addr, { network, wallet })
  // const tx = await authorize(addr)
  console.log(tx)
}
