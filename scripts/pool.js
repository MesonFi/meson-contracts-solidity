const { adaptors } = require('@mesonfi/sdk')
const { getClient } = require('./lib/getClient')
const { addSupportedTokens, deposit, withdraw, send, authorize, transferOwner, withdrawServiceFee } = require('./lib/pool')

require('dotenv').config()

const { LP_PRIVATE_KEY } = process.env

const amount = '10'
const symbol = 'USDC'
const addr = ''

module.exports = async function pool(network) {
  const client = getClient(network)

  const wallet = adaptors.getWallet(LP_PRIVATE_KEY, client)
  console.log(`⬜️ LP address: ${wallet.address}`)

  console.log(`🟩 Status: ${await client.detectNetwork()}`)
  console.log(`🟩 Block height: ${await client.getBlockNumber()}`)
  console.log(`🟩 LP balance: ${await client.getBalance(wallet.address) / 1e8} ${client.isTestnet? 'tBTC' : 'BTC'}`)

  const tx = await wallet.transfer({ to: wallet.address, value: 12000000 })
  console.log(`🟦 Simple transfer: ${tx.hash}`)
  console.log(`   View on block explorer: https://mempool.space/testnet/tx/${tx.hash}`)
  console.log(`   Waiting for confirmation...`)
  console.log(await tx.wait())
  
  // const tx = await deposit(symbol, amount, { network, wallet })
  // const tx = await withdraw(symbol, amount, { network, wallet })
  // const tx = await send(symbol, amount, addr, { network, wallet })
  // const tx = await addSupportedTokens(tokens, { network, wallet })
  // const tx = await authorize(addr, { network, wallet })
  // const tx = await transferOwner(addr, { network, wallet })
  // const tx = await withdrawServiceFee(symbol, amount, { network, wallet })
  // console.log(tx)
}