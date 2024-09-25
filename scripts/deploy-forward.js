const { adaptors } = require('@mesonfi/sdk')
const { getAdaptor } = require('./lib/getAdaptor')
const { deployContract } = require('./lib/deploy')

require('dotenv').config()

const { PRIVATE_KEY } = process.env

module.exports = async function deployForwardContract(network) {
  const adaptor = getAdaptor(network)
  await hre.run('compile')

  const wallet = adaptors.getWallet(PRIVATE_KEY, adaptor)
  console.log('Deploying ForwardTokenContract...')
  await deployContract('ForwardTokenContract', wallet)
}
