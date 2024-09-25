const { adaptors } = require('@mesonfi/sdk')
const { Meson } = require('@mesonfi/contract-abis')
const { getAdaptor } = require('./lib/getAdaptor')
const { addSupportedTokens, deposit, withdraw, send, authorize, transferOwner, withdrawServiceFee } = require('./lib/pool')

require('dotenv').config()

const { LP_PRIVATE_KEY } = process.env

const amount = '10'
const symbol = 'USDC'
const addr = ''

module.exports = async function pool(network) {
  const adaptor = getAdaptor(network)

  const wallet = adaptors.getWallet(LP_PRIVATE_KEY, adaptor)
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
