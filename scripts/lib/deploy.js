const { Meson } = require('@mesonfi/contract-abis')
const { deployContract, getContract } = require('./adaptor')

exports.deployContract = deployContract

exports.deployMeson = async function deployMeson(wallet, upgradable, premiumManager, tokens) {
  let mesonContract
  if (upgradable) {
    console.log('Deploying ProxyToMeson & UpgradableMeson...')
    const proxy = await deployContract('ProxyToMeson', wallet, [premiumManager])
    mesonContract = getContract(proxy.address, Meson.abi, wallet)
  } else {
    console.log('Deploying Meson...')
    mesonContract = await deployContract('Meson', wallet, [premiumManager])
  }

  console.log('Adding supported tokens', tokens)
  const tx = await mesonContract.addMultipleSupportedTokens(tokens.map(t => t.addr), tokens.map(t => t.tokenIndex))
  await tx.wait(1)
  return mesonContract
}
