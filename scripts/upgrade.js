const { adaptor } = require('@mesonfi/sdk')
const { getProvider } = require('./lib/getProvider')
const { deployContract } = require('./lib/deploy')

require('dotenv').config()

const { PRIVATE_KEY } = process.env

module.exports = async function upgrade(network) {
  const provider = getProvider(network)
  await hre.run('compile')

  const wallet = adaptor.getWallet(PRIVATE_KEY, provider)
  console.log('Deploying UpgradableMeson...')
  const impl = await deployContract('UpgradableMeson', wallet)
  const abi = JSON.parse(impl.interface.format('json'))
  const proxy = adaptor.getContract(network.mesonAddress, abi, wallet)
  await proxy.upgradeTo(impl.address)
  console.log('Meson upgraded')
}
