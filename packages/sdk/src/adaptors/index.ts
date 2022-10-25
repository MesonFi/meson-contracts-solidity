import { AptosClient } from 'aptos'
import { providers, Signer } from 'ethers'
import { Provider as ZkProvider, Wallet as ZkWallet } from 'zksync-web3'

import * as _aptos from './aptos'
import * as _ether from './ether'
import * as _tron from './tron'
import * as _zksync from './zksync'
import AptosAdaptor from './aptos/AptosAdaptor'

export function getWallet (privateKey, client) {
  if (client instanceof ZkProvider) {
    return _zksync.getWallet(privateKey, client)
  } else if (client instanceof providers.Provider) {
    return _ether.getWallet(privateKey, client)
  } else if (client instanceof AptosClient) {
    return _aptos.getWallet(privateKey, client)
  } else { // should be a TronWeb instance
    return _tron.getWallet(privateKey, client)
  }
}

export function getContract(address, abi, clientOrAdaptor) {
  if (clientOrAdaptor instanceof ZkProvider || clientOrAdaptor instanceof ZkWallet) {
    return _zksync.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof providers.Provider || Signer.isSigner(clientOrAdaptor)) {
    return _ether.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof AptosClient || clientOrAdaptor instanceof AptosAdaptor) {
    return _aptos.getContract(address, abi, clientOrAdaptor)
  } else {
    return _tron.getContract(address, abi, clientOrAdaptor)
  }
}

export const aptos = _aptos
export const ether = _ether
export const tron = _tron
export const zksync = _zksync
