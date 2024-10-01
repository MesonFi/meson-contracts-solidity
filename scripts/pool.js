const { adaptors } = require('@mesonfi/sdk')
const { Meson } = require('@mesonfi/contract-abis')
const { getAdaptor } = require('./lib/getAdaptor')
const { addSupportedTokens, deposit, withdraw, send, authorize, transferOwner, withdrawServiceFee } = require('./lib/pool')

require('dotenv').config()

const { LP_PRIVATE_KEY } = process.env

const amount = '0.032'
const symbol = 'USDC'
const addr = '0QDC8wdZwFffsiblcanTAn0Wp4Hi7pm0YlXUogaHMbS4XgQj'

module.exports = async function pool(network) {
  const adaptor = getAdaptor(network)

  const wallet = adaptors.getWallet(LP_PRIVATE_KEY, adaptor)
  console.log(`⬜️ LP address: ${wallet.address}`)

  const mesonInstance = adaptors.getContract(network.mesonAddress, Meson.abi, wallet)
  console.log(`🟩 Status: ${JSON.stringify(await mesonInstance.provider.detectNetwork())}`)
  // console.log(`🟩 Block height: ${await mesonInstance.provider.getBlockNumber()}`)
  // console.log(`🟩 LP balance: ${await mesonInstance.provider.getBalance(wallet.address)}`)

  let tx

  // tx = await wallet.transfer(addr, "0.1")
  // await tx.wait(); console.log("🟦 Transfer (native) success!")

  // const tx = await deposit(symbol, amount, { network, wallet })
  // const tx = await withdraw(symbol, amount, { network, wallet })

  // tx = await send(symbol, amount, addr, { network, wallet })
  // await tx.wait(); console.log(`🟦 Transfer ${amount} ${symbol} success!`)

  // tx = await addSupportedTokens([{addr: 'kQAOWCl4SQWu9gk81yIliNlwIemGPU-xbhUK6fq4uAcM3Rk6', tokenIndex: 1}], { network, wallet })
  // await tx.wait(); console.log(`🟦 Add supported tokens success!`)

  // const tx = await authorize(addr, { network, wallet })
  // const tx = await transferOwner(addr, { network, wallet })
  // const tx = await withdrawServiceFee(symbol, amount, { network, wallet })
  // console.log(tx)

  // [✅] transfer(native)
  // [ ] deposit
  // [ ] withdraw
  // [✅] send token
  // [✅] addSupportedTokens
  // [ ] authorize
  // [ ] transferOwner
  // [ ] withdrawServiceFee

}