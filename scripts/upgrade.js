const { adaptors } = require('@mesonfi/sdk')
const { getClient } = require('./lib/getClient')
const { deployContract } = require('./lib/deploy')

require('dotenv').config()

const { PRIVATE_KEY } = process.env

module.exports = async function upgrade(network) {
  const client = getClient(network)
  await hre.run('compile')

  const wallet = adaptors.getWallet(PRIVATE_KEY, client)
  console.log('Deploying UpgradableMeson...')
  const impl = await deployContract('UpgradableMeson', wallet)
  const abi = JSON.parse(impl.interface.format('json'))
  const proxy = adaptors.getContract(network.mesonAddress, abi, wallet)
  await proxy.upgradeTo(impl.address)
  console.log('Meson upgraded')
}
