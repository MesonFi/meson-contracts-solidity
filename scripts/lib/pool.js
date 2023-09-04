const { MesonClient, adaptors } = require('@mesonfi/sdk')
const { Meson } = require('@mesonfi/contract-abis')

function getTokenIndex(network, symbol) {
  if (symbol.toLowerCase() === 'uct') {
    return 255
  }

  const token = network.tokens.find(t => !t.disabled && t.symbol.toLowerCase().includes(symbol.toLowerCase()))
  return token.tokenIndex
}

exports.addSupportedTokens = async function addSupportedTokens(tokens, { network, wallet }) {
  const mesonInstance = adaptors.getContract(network.mesonAddress, Meson.abi, wallet)

  console.log('Adding supported tokens', tokens)
  let tx
  if (tokens.length > 1) {
    tx = await mesonInstance.addMultipleSupportedTokens(tokens.map(t => t.addr), tokens.map(t => t.tokenIndex))
  } else {
    tx = await mesonInstance.addSupportToken(tokens[0].addr, tokens[0].tokenIndex)
  }
  await tx.wait(1)
  return tx
}

exports.removeSupportToken = async function removeSupportToken(tokenIndex, { network, wallet }) {
  const mesonInstance = adaptors.getContract(network.mesonAddress, Meson.abi, wallet)

  console.log('Removing supported token', tokenIndex)
  const tx = await mesonInstance.removeSupportToken(tokenIndex)
  await tx.wait(1)
  return tx
}

exports.deposit = async function deposit(symbol, amount, { network, wallet }) {
  const mesonInstance = adaptors.getContract(network.mesonAddress, Meson.abi, wallet)
  const mesonClient = await MesonClient.Create(mesonInstance)
  const tokenIndex = getTokenIndex(network, symbol)

  const allowance = await mesonClient.getAllowance(wallet.address, tokenIndex)
  console.log(`Allowance: ${allowance.display}`)
  const value = MesonClient.toSwapValue(amount)
  if (allowance.value.lt(value)) {
    console.log(`Approving...`)
    const toApprove = MesonClient.toSwapValue('1000000000') // 1B
    const tx = await mesonClient.approveToken(tokenIndex, mesonInstance.address, toApprove)
    await tx.wait(1)
  }

  console.log(`Depositing ${amount} ${symbol}...`)
  const poolIndex = await mesonInstance.poolOfAuthorizedAddr(wallet.address)

  let tx
  if (poolIndex == 0) {
    tx = await mesonClient.depositAndRegister(tokenIndex, value, 1)
  } else {
    tx = await mesonClient.deposit(tokenIndex, value)
  }
  await tx.wait(1)
  return tx
}

exports.withdraw = async function withdraw(symbol, amount, { network, wallet }) {
  const mesonInstance = adaptors.getContract(network.mesonAddress, Meson.abi, wallet)
  const tokenIndex = getTokenIndex(network, symbol)

  console.log(`Withdrawing ${amount} ${symbol}...`)
  const poolIndex = await mesonInstance.poolOfAuthorizedAddr(wallet.address)
  const poolTokenIndex = tokenIndex * 2**40 + poolIndex

  // const gasLimit = await mesonInstance.estimateGas.withdraw(MesonClient.toSwapValue(amount), poolTokenIndex)
  const tx = await mesonInstance.withdraw(MesonClient.toSwapValue(amount), poolTokenIndex)
  await tx.wait(1)
  return tx
}

exports.withdrawServiceFee = async function withdraw(symbol, amount, { network, wallet }) {
  const mesonInstance = adaptors.getContract(network.mesonAddress, Meson.abi, wallet)
  const tokenIndex = getTokenIndex(network, symbol)

  console.log(`Withdrawing Service Fee ${amount} ${symbol}...`)

  const tx = await mesonInstance.withdrawServiceFee(tokenIndex, MesonClient.toSwapValue(amount), 1)
  await tx.wait(1)
  return tx
}

exports.send = async function send(symbol, amount, recipient, { network, wallet }) {
  const mesonInstance = adaptors.getContract(network.mesonAddress, Meson.abi, wallet)
  const mesonClient = await MesonClient.Create(mesonInstance)
  const tokenIndex = getTokenIndex(network, symbol)

  console.log(`Sending ${amount} ${symbol} to ${recipient}...`)
  const tx = await mesonClient.transferToken(tokenIndex, recipient, MesonClient.toSwapValue(amount))
  await tx.wait(1)
  return tx
}

exports.authorize = async function authorize(addr, { network, wallet }) {
  const mesonInstance = adaptors.getContract(network.mesonAddress, Meson.abi, wallet)

  const poolIndex = await mesonInstance.poolOfAuthorizedAddr(wallet.address)

  console.log(`Authorizing ${addr} to pool ${poolIndex}...`)
  const tx = await mesonInstance.addAuthorizedAddr(addr)
  await tx.wait(1)
  return tx
}

exports.transferOwner = async function transferOwner(addr, { network, wallet }) {
  const mesonInstance = adaptors.getContract(network.mesonAddress, Meson.abi, wallet)

  const poolIndex = await mesonInstance.poolOfAuthorizedAddr(wallet.address)

  console.log(`Transfer owner of pool ${poolIndex} to ${addr}...`)
  const tx = await mesonInstance.transferPoolOwner(addr)
  await tx.wait(1)
  return tx
}
