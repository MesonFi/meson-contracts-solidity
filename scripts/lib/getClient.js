const { ethers } = require('hardhat')
const { AptosClient } = require('aptos')
const TronWeb = require('tronweb')
const { Provider } = require('zksync-web3')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')

exports.getClient = function getClient (network) {
  if (network.id.startsWith('aptos')) {
    return new AptosClient(network.url)
  } else if (network.id.startsWith('tron')) {
    return new TronWeb({ fullHost: network.url })
  } else if (network.id.startsWith('zksync')) {
    return new Provider(network.url)
  } else {
    hre.changeNetwork(network.id)
    ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
    return ethers.provider
  }
}
