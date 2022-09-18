const { getWallet, deployContract } = require('./lib/adaptor')

require('dotenv').config()

const {
  ZKSYNC,
  PRIVATE_KEY
} = process.env

module.exports = async function deployForwardContract(network) {
  if (network.id.startsWith('zksync') && !ZKSYNC) {
    throw new Error('Need to set environment variable ZKSYNC=true for zksync')
  }

  const wallet = getWallet(network, PRIVATE_KEY)
  console.log('Deploying ForwardTokenContract...')
  await deployContract('ForwardTokenContract', wallet)
}
