const { ethers } = require('hardhat')
const { default: BtcAdaptor } = require('@mesonfi/sdk/lib/adaptors/bitcoin/BtcAdaptor')
const { AptosClient } = require('aptos')
const { SuiClient } = require('@mysten/sui.js/client')
const { Connection: SolConnection } = require('@solana/web3.js')
const { RpcProvider: StarkProvider } = require('starknet')
const TronWeb = require('tronweb')
const { Provider } = require('zksync-web3')
const { RPC: CkbRPC } = require('@ckb-lumos/lumos')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')

exports.getClient = function getClient (network) {
  if (network.id.startsWith('aptos')) {
    return new AptosClient(network.url)
  } else if (network.id.startsWith('bitcoin')) {
    return new BtcAdaptor(network.url, network.id === 'bitcoin-testnet', network.mesonAddress)
  } else if (network.id.startsWith('sui')) {
    return new SuiClient({ url: network.url })
  } else if (network.id.startsWith('solana')) {
    return new SolConnection(network.url, 'confirmed')
  } else if (network.id.startsWith('starknet')) {
    return new StarkProvider({ nodeUrl: network.url })
  } else if (network.id.startsWith('tron')) {
    return new TronWeb({ fullHost: network.url })
  } else if (network.id.startsWith('zksync') || network.id.startsWith('zklink')) {
    return new Provider(network.url)
  } else if (network.id.startsWith('ckb')) {
    const client = new CkbRPC(network.url)
    client.metadata = { ...network.metadata, tokens: network.tokens }
    return client
  } else {
    hre.changeNetwork(network.id)
    ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
    return ethers.provider
  }
}
