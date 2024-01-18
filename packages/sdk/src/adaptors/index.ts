import fetch from 'cross-fetch'
global.fetch = fetch

import { AptosClient } from 'aptos'
import { providers, Signer, utils } from 'ethers'
import { JsonRpcProvider as SuiProvider } from '@mysten/sui.js'
import { Connection as SolConnection } from '@solana/web3.js'
import { RpcProvider as StarkProvider } from 'starknet'
import TronWeb from 'tronweb'
import { Provider as ZkProvider, Wallet as ZkWallet } from 'zksync-web3'

import * as _aptos from './aptos'
import * as _ethers from './ethers'
import * as _sui from './sui'
import * as _solana from './solana'
import * as _starknet from './starknet'
import * as _tron from './tron'
import * as _zksync from './zksync'
import AptosAdaptor from './aptos/AptosAdaptor'
import SuiAdaptor from './sui/SuiAdaptor'
import SolanaAdaptor from './solana/SolanaAdaptor'
import StarkAdaptor from './starknet/StarkAdaptor'

export function getWallet (privateKey, client) {
  if (client instanceof AptosClient) {
    return _aptos.getWallet(privateKey, client)
  } else if (client instanceof SuiProvider) {
    return _sui.getWallet(privateKey, client)
  } else if (client instanceof SolConnection) {
    return _solana.getWallet(privateKey, client)
  } else if (client instanceof StarkProvider) {
    return _starknet.getWallet(privateKey, client)
  } else if (client instanceof ZkProvider) {
    return _zksync.getWallet(privateKey, client)
  } else if (client instanceof providers.Provider) {
    return _ethers.getWallet(privateKey, client)
  } else { // should be a TronWeb instance
    return _tron.getWallet(privateKey, client)
  }
}

export function getContract(address, abi, clientOrAdaptor) {
  if (clientOrAdaptor instanceof AptosClient || clientOrAdaptor instanceof AptosAdaptor) {
    return _aptos.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof SuiProvider || clientOrAdaptor instanceof SuiAdaptor) {
    return _sui.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof SolConnection || clientOrAdaptor instanceof SolanaAdaptor) {
    return _solana.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof StarkProvider || clientOrAdaptor instanceof StarkAdaptor) {
    return _starknet.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof providers.Provider || Signer.isSigner(clientOrAdaptor)) {
    return _ethers.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof ZkProvider || clientOrAdaptor instanceof ZkWallet) {
    return _zksync.getContract(address, abi, clientOrAdaptor)
  } else {
    return _tron.getContract(address, abi, clientOrAdaptor)
  }
}

export type AddressFormat = 'ethers' | 'tron' | 'aptos' | 'sui' | 'solana' | 'starknet'
export function isAddress(format: AddressFormat, addr: string): boolean {
  if (format === 'ethers') {
    return utils.isHexString(addr) && utils.isAddress(addr)
  } else if (format === 'tron') {
    return TronWeb.isAddress(addr)
  } else if (format === 'aptos' || format === 'sui') {
    return utils.isHexString(addr) && addr.length <= 66 && addr.length > 50
  } else if (format === 'solana') {
    return !!_solana.formatAddress(addr)
  } else if (format === 'starknet') {
    // TODO
    return !!addr
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
    return _aptos.formatAddress(addr)
  } else if (format === 'sui') {
    return _sui.formatAddress(addr)
  } else if (format === 'solana') {
    return _solana.formatAddress(addr)
  } else if (format === 'starknet') {
    return _starknet.formatAddress(addr)
  }
}

export const aptos = _aptos
export const ethers = _ethers
export const sui = _sui
export const solana = _solana
export const starknet = _starknet
export const tron = _tron
export const zksync = _zksync
