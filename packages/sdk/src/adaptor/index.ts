import { AptosClient } from 'aptos'
import { providers, Signer } from 'ethers'
import { Provider as ZkProvider, Wallet as ZkWallet } from 'zksync-web3'

import * as _aptos from './aptos'
import * as _ether from './ether'
import * as _tron from './tron'
import * as _zksync from './zksync'
import { AptosProvider } from './aptos/classes'

export function getWallet (privateKey, provider) {
  if (provider instanceof ZkProvider) {
    return _zksync.getWallet(privateKey, provider)
  } else if (provider instanceof providers.Provider) {
    return _ether.getWallet(privateKey, provider)
  } else if (provider instanceof AptosClient) {
    return _aptos.getWallet(privateKey, provider)
  } else {
    return _tron.getWallet(privateKey, provider)
  }
}

export function getContract(address, abi, provider) {
  if (provider instanceof ZkWallet || provider instanceof ZkProvider) {
    return _zksync.getContract(address, abi, provider)
  } else if (Signer.isSigner(provider) || provider instanceof providers.Provider) {
    return _ether.getContract(address, abi, provider)
  } else if (provider instanceof AptosProvider || provider instanceof AptosClient) {
    return _aptos.getContract(address, abi, provider)
  } else {
    return _tron.getContract(address, abi, provider)
  }
}

export const aptos = _aptos
export const ether = _ether
export const tron = _tron
export const zksync = _zksync
