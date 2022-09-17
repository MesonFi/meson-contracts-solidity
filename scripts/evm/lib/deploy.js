const { ethers } = require('hardhat')
const { Meson } = require('@mesonfi/contract-abis')

exports.deployMeson = async function deployMeson(wallet, premiumManager, tokens) {
  const mesonFactory = await ethers.getContractFactory('Meson', wallet)

  console.log('Deploying Meson...')
  const mesonContract = await mesonFactory.deploy(premiumManager)
  await mesonContract.deployed()
  console.log('Meson deployed to:', mesonContract.address)

  console.log('Adding supported tokens', tokens)
  await mesonContract.addMultipleSupportedTokens(tokens.map(t => t.addr), tokens.map(t => t.tokenIndex))

  return mesonContract
}

exports.deployMesonUpgradable = async function deployMesonUpgradable(wallet, premiumManager, tokens) {
  const mesonFactory = await ethers.getContractFactory('ProxyToMeson', wallet)

  console.log('Deploying ProxyToMeson & UpgradableMeson...')
  const proxy = await mesonFactory.deploy(premiumManager)
  await proxy.deployed()
  console.log('ProxyToMeson deployed to:', proxy.address)

  const mesonContract = new ethers.Contract(proxy.address, Meson.abi, wallet)

  console.log('Adding supported tokens', tokens)
  await mesonContract.addMultipleSupportedTokens(tokens.map(t => t.addr), tokens.map(t => t.tokenIndex))

  return mesonContract
}
