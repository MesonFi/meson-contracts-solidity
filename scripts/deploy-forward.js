const { adaptors } = require('@mesonfi/sdk')
const { getClient } = require('./lib/getClient')
const { deployContract } = require('./lib/deploy')

require('dotenv').config()

const { PRIVATE_KEY } = process.env

module.exports = async function deployForwardContract(network) {
  const client = getClient(network)
  await hre.run('compile')

  const wallet = adaptors.getWallet(PRIVATE_KEY, client)
  console.log('Deploying ForwardTokenContract...')
  await deployContract('ForwardTokenContract', wallet)
}
