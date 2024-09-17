const { adaptors } = require('@mesonfi/sdk')
const { Meson } = require('@mesonfi/contract-abis')
const { getClient } = require('./lib/getClient')
const { addSupportedTokens, deposit, withdraw, send, authorize, transferOwner, withdrawServiceFee } = require('./lib/pool')

require('dotenv').config()

const { TON_PRIVATE_KEY } = process.env // Notice that TON_PRIVATE_KEY has 64 bytes!

const amount = '10'
const symbol = 'USDC'
const addr = ''

module.exports = async function pool(network) {
  const client = getClient(network)

  const wallet = adaptors.getWallet(TON_PRIVATE_KEY, client)
  console.log(`⬜️ LP address: ${wallet.address}`)

  const mesonInstance = adaptors.getContract(network.mesonAddress, Meson.abi, wallet)
  console.log(`🟩 Status: ${JSON.stringify(await mesonInstance.provider.detectNetwork())}`)
  console.log(`🟩 Block height: ${await mesonInstance.provider.getBlockNumber()}`)
  console.log(`🟩 LP balance: ${await mesonInstance.provider.getBalance(wallet.address)}`)

  // const tx = await deposit(symbol, amount, { network, wallet })
  // const tx = await withdraw(symbol, amount, { network, wallet })
  // const tx = await send(symbol, amount, addr, { network, wallet })
  // const tx = await addSupportedTokens(tokens, { network, wallet })
  // const tx = await authorize(addr, { network, wallet })
  // const tx = await transferOwner(addr, { network, wallet })
  // const tx = await withdrawServiceFee(symbol, amount, { network, wallet })
  // console.log(tx)
}