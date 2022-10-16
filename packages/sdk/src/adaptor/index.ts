import { providers, Signer } from 'ethers'
import { Provider as ZkProvider, Wallet as ZkWallet } from 'zksync-web3'
import { AptosClient } from 'aptos'

import * as zksync from './zksync'
import * as ether from './ether'
import * as aptos from './aptos'
import { AptosProvider } from './aptos/classes'
import * as tron from './tron'

export function getWallet (privateKey, provider) {
  if (provider instanceof ZkProvider) {
    return zksync.getWallet(privateKey, provider)
  } else if (provider instanceof providers.Provider) {
    return ether.getWallet(privateKey, provider)
  } else if (provider instanceof AptosClient) {
    return aptos.getWallet(privateKey, provider)
  } else {
    return tron.getWallet(privateKey, provider)
  }
}

export function getContract(address, abi, provider) {
  if (provider instanceof ZkWallet || provider instanceof ZkProvider) {
    return zksync.getContract(address, abi, provider)
  } else if (Signer.isSigner(provider) || provider instanceof providers.Provider) {
    return ether.getContract(address, abi, provider)
  } else if (provider instanceof AptosProvider || provider instanceof AptosClient) {
    return aptos.getContract(address, abi, provider)
  } else {
    return tron.getContract(address, abi, provider)
  }
}
