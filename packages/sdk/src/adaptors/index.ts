import { AptosClient } from 'aptos'
import { providers, Signer, utils } from 'ethers'
import TronWeb from 'tronweb'
import { Provider as ZkProvider, Wallet as ZkWallet } from 'zksync-web3'

import * as _aptos from './aptos'
import * as _ethers from './ethers'
import * as _tron from './tron'
import * as _zksync from './zksync'
import AptosAdaptor from './aptos/AptosAdaptor'

export function getWallet (privateKey, client) {
  if (client instanceof ZkProvider) {
    return _zksync.getWallet(privateKey, client)
  } else if (client instanceof providers.Provider) {
    return _ethers.getWallet(privateKey, client)
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
    return _ethers.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof AptosClient || clientOrAdaptor instanceof AptosAdaptor) {
    return _aptos.getContract(address, abi, clientOrAdaptor)
  } else {
    return _tron.getContract(address, abi, clientOrAdaptor)
  }
}

export type AddressFormat = 'ethers' | 'tron' | 'aptos'
export function isAddress(format: AddressFormat, addr: string): boolean {
  if (format === 'ethers') {
    return utils.isHexString(addr) && utils.isAddress(addr)
  } else if (format === 'tron') {
    return TronWeb.isAddress(addr)
  } else if (format === 'aptos') {
    return utils.isHexString(addr) && addr.length <= 66 && addr.length > 50
  }
}

export function formatAddress(format: AddressFormat, addr: string): string {
  if (format === 'ethers') {
    if (utils.isAddress(addr)) {
      return utils.getAddress(addr).toLowerCase()
    } else {
      return addr
    }
  } else if (format === 'tron') {
    return TronWeb.address.fromHex(addr)
  } else if (format === 'aptos') {
    const parts = addr.split('::')
    parts[0] = utils.hexZeroPad(parts[0], 32)
    return parts.join('::')
  }
}

export const aptos = _aptos
export const ethers = _ethers
export const tron = _tron
export const zksync = _zksync
