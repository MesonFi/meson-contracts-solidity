const { adaptors, MesonClient } = require('@mesonfi/sdk')
const { Meson } = require('@mesonfi/contract-abis')
const { getAdaptor } = require('./lib/getAdaptor')
const { addSupportedTokens, deposit, withdraw, send, authorize, transferOwner, withdrawServiceFee } = require('./lib/pool')

require('dotenv').config()

const { LP_PRIVATE_KEY } = process.env

const amount = '0.06'
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

  // tx = await addSupportedTokens([{addr: 'kQCuEuPPIiD3ngKC0JqtCaeS5ob6C9_fC3EkW8gWWums5GNJ', tokenIndex: 1}], { network, wallet })
  // await tx.wait(); console.log(`🟦 Add supported tokens success!`)

  // tx = await deposit('USDC', '10', { network, wallet })
  // await tx.wait(); console.log(`🟦 Deposit success!`)

  // tx = await withdraw('USDC', '3', { network, wallet })
  // await tx.wait(); console.log(`🟦 Withdraw success!`)

  // tx = await send(symbol, amount, addr, { network, wallet })
  // await tx.wait(); console.log(`🟦 Transfer ${amount} ${symbol} success!`)

  // const swapId = '0x000000000000000000000000000000000000000000000000000000000000dead'
  // tx = await mesonInstance.directRelease(swapId, "EQDC8wdZwFffsiblcanTAn0Wp4Hi7pm0YlXUogaHMbS4XuJs", 1, MesonClient.toSwapValue(amount))
  // await tx.wait(); console.log(`🟦 Direct release success!`)

  // const encoded = '0x00000000ea60000000000000000000000000000000000000000000000000cafe'
  // tx = await mesonInstance.directExecuteSwap(encoded, 1, MesonClient.toSwapValue('0.06'))   // 60000 -> 0x000000ea60
  // await tx.wait(); console.log(`🟦 Direct execute-swap success (expected failure)!`)

  // tx = await mesonInstance.directExecuteSwap(encoded, 1, MesonClient.toSwapValue('0.06'))
  // await tx.wait(); console.log(`🟦 Direct execute-swap 2nd times (expected refunding)!`)

  // tx = await authorize(addr, { network, wallet })
  // tx = await transferOwner(addr, { network, wallet })
  // tx = await withdrawServiceFee(symbol, amount, { network, wallet })

  const mesonClient = await MesonClient.Create(mesonInstance)
  const tokenInstance = mesonClient.getTokenContract("kQCuEuPPIiD3ngKC0JqtCaeS5ob6C9_fC3EkW8gWWums5GNJ")
  console.log(await tokenInstance.name())

  // [✅] transfer(native)
  // [✅] deposit
  // [✅] withdraw
  // [✅] send token
  // [✅] addSupportedTokens
  // [✅] directRelease
  // [✅] directExecute
  // [❌] authorize
  // [❌] transferOwner
  // [❌] withdrawServiceFee

}