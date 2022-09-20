const { ethers } = require('hardhat')
const TronWeb = require('tronweb')
const { Provider } = require('zksync-web3')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')

exports.getProvider = function getProvider (network) {
  if (network.id.startsWith('tron')) {
    return new TronWeb({ fullHost: network.url })
  } else if (network.id.startsWith('zksync')) {
    if (!process.env.ZKSYNC) {
      throw new Error('Need to set environment variable ZKSYNC=true for zksync')
    }
    return new Provider(network.url)
  } else {
    hre.changeNetwork(network.id)
    ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
    return ethers.provider
  }
}
