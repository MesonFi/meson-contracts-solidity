const { adaptor } = require('@mesonfi/sdk')
const { getProvider } = require('./lib/getProvider')
const { deployContract } = require('./lib/deploy')

require('dotenv').config()

const { PRIVATE_KEY } = process.env

module.exports = async function deployForwardContract(network) {
  const provider = getProvider(network)

  const wallet = adaptor.getWallet(PRIVATE_KEY, provider)
  console.log('Deploying ForwardTokenContract...')
  await deployContract('ForwardTokenContract', wallet)
}
