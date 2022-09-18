const { getWallet, deployContract, getContract } = require('./lib/adaptor')

require('dotenv').config()

const {
  ZKSYNC,
  PRIVATE_KEY
} = process.env

module.exports = async function upgrade(network) {
  if (network.id.startsWith('zksync') && !ZKSYNC) {
    throw new Error('Need to set environment variable ZKSYNC=true for zksync')
  }
  await hre.run('compile')

  const wallet = getWallet(network, PRIVATE_KEY)

  console.log('Deploying UpgradableMeson...')
  const impl = await deployContract('UpgradableMeson', wallet)
  const abi = JSON.parse(impl.interface.format('json'))
  const proxy = getContract(network.mesonAddress, abi, wallet)
  await proxy.upgradeTo(impl.address)
  console.log('Meson upgraded')
}
