const { adaptors } = require('@mesonfi/sdk')
const { getAdaptor } = require('./lib/getAdaptor')
const { deployContract } = require('./lib/deploy')

require('dotenv').config()

const { PRIVATE_KEY } = process.env

module.exports = async function upgrade(network) {
  const adaptor = getAdaptor(network)
  await hre.run('compile')

  const wallet = adaptors.getWallet(PRIVATE_KEY, adaptor)
  console.log('Deploying UpgradableMeson...')
  const impl = await deployContract('UpgradableMeson', wallet)
  const abi = JSON.parse(impl.interface.format('json'))
  const proxy = adaptors.getContract(network.mesonAddress, abi, wallet)
  await proxy.upgradeTo(impl.address)
  console.log('Meson upgraded')
}
