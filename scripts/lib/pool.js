const { ethers } = require('hardhat')
const { adaptor } = require('@mesonfi/sdk')
const { Meson, ERC20 } = require('@mesonfi/contract-abis')

function getToken(network, symbol, wallet) {
  const token = symbol.toLowerCase() === 'uct'
    ? { addr: network.uctAddress, tokenIndex: 255 }
    : network.tokens.find(t => t.symbol.toLowerCase().includes(symbol.toLowerCase()))
  const instance = adaptor.getContract(token.addr, ERC20.abi, wallet)
  return { instance, tokenIndex: token.tokenIndex }
}

exports.deposit = async function deposit(symbol, amount, { network, wallet }) {
  const mesonInstance = adaptor.getContract(network.mesonAddress, Meson.abi, wallet)
  const token = getToken(network, symbol, wallet)
  const decimals = await token.instance.decimals()
  const value = ethers.utils.parseUnits(amount, decimals)
  const allowance = await token.instance.allowance(await wallet.getAddress(), mesonInstance.address)
  console.log(`Allowance: ${ethers.utils.formatUnits(allowance, decimals)}`)
  if (allowance.lt(value)) {
    console.log(`Approving...`)
    const allowance = ethers.utils.parseUnits('1000000000', decimals) // 1B
    const tx = await token.instance.approve(mesonInstance.address, allowance)
    await tx.wait(1)
  }

  console.log(`Depositing ${amount} ${symbol}...`)
  const poolIndex = await mesonInstance.poolOfAuthorizedAddr(await wallet.getAddress())
  const needRegister = poolIndex == 0
  const poolTokenIndex = token.tokenIndex * 2**40 + (needRegister ? 1 : poolIndex)

  let tx
  if (needRegister) {
    tx = await mesonInstance.depositAndRegister(ethers.utils.parseUnits(amount, 6), poolTokenIndex)
  } else {
    tx = await mesonInstance.deposit(ethers.utils.parseUnits(amount, 6), poolTokenIndex)
  }
  await tx.wait(1)
  return tx
}

exports.withdraw = async function withdraw(symbol, amount, { network, wallet }) {
  const mesonInstance = adaptor.getContract(network.mesonAddress, Meson.abi, wallet)
  const token = getToken(network, symbol, wallet)

  console.log(`Withdrawing ${amount} ${symbol}...`)
  const poolIndex = await mesonInstance.poolOfAuthorizedAddr(await wallet.getAddress())
  const poolTokenIndex = token.tokenIndex * 2**40 + poolIndex

  // const gasLimit = await mesonInstance.estimateGas.withdraw(ethers.utils.parseUnits(amount, 6), poolTokenIndex)
  const tx = await mesonInstance.withdraw(ethers.utils.parseUnits(amount, 6), poolTokenIndex)
  await tx.wait(1)
  return tx
}

exports.send = async function send(symbol, amount, recipient, { network, wallet }) {
  const token = getToken(network, symbol, wallet)
  const decimals = await token.instance.decimals()
  console.log(`Sending ${amount} ${symbol} to ${recipient}...`)
  const tx = await token.instance.transfer(recipient, ethers.utils.parseUnits(amount, decimals))
  await tx.wait(1)
  return tx
}

exports.authorize = async function authorize(addr, { network, wallet }) {
  const mesonInstance = adaptor.getContract(network.mesonAddress, Meson.abi, wallet)

  const poolIndex = await mesonInstance.poolOfAuthorizedAddr(await wallet.getAddress())

  console.log(`Authorizing ${addr} to pool ${poolIndex}...`)
  const tx = await mesonInstance.addAuthorizedAddr(addr)
  await tx.wait(1)
  return tx
}
