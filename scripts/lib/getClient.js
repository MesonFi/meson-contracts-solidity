const { ethers } = require('hardhat')
const { AptosClient } = require('aptos')
const { JsonRpcProvider: SuiProvider, Connection: SuiConnection } = require('@mysten/sui.js')
const { Connection: SolConnection } = require('@solana/web3.js')
const { RpcProvider: StarkProvider } = require('starknet')
const TronWeb = require('tronweb')
const { Provider } = require('zksync-web3')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')

exports.getClient = function getClient (network) {
  if (network.id.startsWith('aptos')) {
    return new AptosClient(network.url)
  } else if (network.id.startsWith('sui')) {
    const connection = new SuiConnection({
      fullnode: network.url,
      faucet: 'https://faucet.testnet.sui.io/gas',
    })
    return new SuiProvider(connection)
  } else if (network.id.startsWith('solana')) {
    return new SolConnection(network.url, 'confirmed')
  } else if (network.id.startsWith('starknet')) {
    return new StarkProvider({ nodeUrl: network.url })
  } else if (network.id.startsWith('tron')) {
    return new TronWeb({ fullHost: network.url })
  } else if (network.id.startsWith('zksync') || network.id.startsWith('zklink')) {
    return new Provider(network.url)
  } else {
    hre.changeNetwork(network.id)
    ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
    return ethers.provider
  }
}
