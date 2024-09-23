import fetch from 'cross-fetch'
global.fetch = fetch

import { AptosClient } from 'aptos'
import { RPC as CkbRPC } from '@ckb-lumos/lumos'
import { providers, Signer, utils } from 'ethers'
import { Connection as SolConnection } from '@solana/web3.js'
import { RpcProvider as StarkProvider } from 'starknet'
import { SuiClient } from '@mysten/sui.js/client'
import TronWeb from 'tronweb'
import { Provider as ZkProvider, Wallet as ZkWallet } from 'zksync-web3'
import BtcClient from './bitcoin/BtcClient'

import * as _aptos from './aptos'
import * as _bitcoin from './bitcoin'
import * as _ckb from './ckb'
import * as _ethers from './ethers'
import * as _solana from './solana'
import * as _starknet from './starknet'
import * as _sui from './sui'
import * as _tron from './tron'
import * as _zksync from './zksync'

import EthersAdaptor from './ethers/EthersAdaptor'
import ZksyncAdaptor from './zksync/ZksyncAdaptor'
import AptosAdaptor from './aptos/AptosAdaptor'
import BtcAdaptor from './bitcoin/BtcAdaptor'
import CkbAdaptor from './ckb/CkbAdaptor'
import SolanaAdaptor from './solana/SolanaAdaptor'
import StarkAdaptor from './starknet/StarkAdaptor'
import SuiAdaptor from './sui/SuiAdaptor'
import TronAdaptor from './tron/TronAdaptor'

import {
  FailoverEthersAdaptor,
  FailoverZksyncAdaptor,
  FailoverAptosAdaptor,
  FailoverBtcAdaptor,
  FailoverCkbAdaptor,
  FailoverSolanaAdaptor,
  FailoverStarkAdaptor,
  FailoverSuiAdaptor,
  FailoverTronAdaptor,
} from './FailoverAdaptors'

export function getWallet (privateKey, client) {
  if (client instanceof AptosClient) {
    return _aptos.getWallet(privateKey, client)
  } else if (client instanceof BtcClient) {
    return _bitcoin.getWallet(privateKey, client)
  } else if (client instanceof SuiClient) {
    return _sui.getWallet(privateKey, client)
  } else if (client instanceof SolConnection) {
    return _solana.getWallet(privateKey, client)
  } else if (client instanceof StarkProvider) {
    return _starknet.getWallet(privateKey, client)
  } else if (client instanceof CkbRPC) {
    return _ckb.getWallet(privateKey, client)
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
  } else if (clientOrAdaptor instanceof BtcClient || clientOrAdaptor instanceof BtcAdaptor) {
    return _bitcoin.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof SuiClient || clientOrAdaptor instanceof SuiAdaptor) {
    return _sui.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof SolConnection || clientOrAdaptor instanceof SolanaAdaptor) {
    return _solana.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof StarkProvider || clientOrAdaptor instanceof StarkAdaptor) {
    return _starknet.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof CkbRPC || clientOrAdaptor instanceof CkbAdaptor) {
    return _ckb.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof providers.Provider || Signer.isSigner(clientOrAdaptor)) {
    return _ethers.getContract(address, abi, clientOrAdaptor)
  } else if (clientOrAdaptor instanceof ZkProvider || clientOrAdaptor instanceof ZkWallet) {
    return _zksync.getContract(address, abi, clientOrAdaptor)
  } else {
    return _tron.getContract(address, abi, clientOrAdaptor)
  }
}

export function getFailoverAdaptor(clients: any[]) {
  if (!clients.length) {
    throw new Error('Empty clients')
  }
  if (clients.every(c => c instanceof ZkProvider)) {
    return new FailoverZksyncAdaptor(...clients.map(c => new ZksyncAdaptor(c)))
  } else if (clients.every(c => c instanceof providers.JsonRpcProvider)) {
    return new FailoverEthersAdaptor(...clients.map(c => new EthersAdaptor(c)))
  } else if (clients.every(c => c instanceof AptosClient)) {
    return new FailoverAptosAdaptor(...clients.map(c => new AptosAdaptor(c)))
  } else if (clients.every(c => c instanceof BtcClient)) {
    return new FailoverBtcAdaptor(...clients.map(c => new BtcAdaptor(c)))
  } else if (clients.every(c => c instanceof CkbRPC)) {
    return new FailoverCkbAdaptor(...clients.map(c => new CkbAdaptor(c)))
  } else if (clients.every(c => c instanceof SolConnection)) {
    return new FailoverSolanaAdaptor(...clients.map(c => new SolanaAdaptor(c)))
  } else if (clients.every(c => c instanceof StarkProvider)) {
    return new FailoverStarkAdaptor(...clients.map(c => new StarkAdaptor(c)))
  } else if (clients.every(c => c instanceof SuiClient)) {
    return new FailoverSuiAdaptor(...clients.map(c => new SuiAdaptor(c)))
  } else if (true) { // TODO: check fron tron client
    return new FailoverTronAdaptor(...clients.map(c => new TronAdaptor(c)))
  } else {
    throw new Error('Conflicting clients')
  }
}

export type AddressFormat = 'ethers' | 'bitcoin' | 'tron' | 'aptos' | 'sui' | 'solana' | 'starknet' | 'ckb'
export function isAddress(format: AddressFormat, addr: string): boolean {
  if (format === 'ethers') {
    return utils.isHexString(addr) && utils.isAddress(addr)
  } else if (format === 'bitcoin') {
    return !!_bitcoin.formatAddress(addr)
  } else if (format === 'tron') {
    return TronWeb.isAddress(addr)
  } else if (format === 'aptos' || format === 'sui') {
    return utils.isHexString(addr) && addr.length <= 66 && addr.length > 50
  } else if (format === 'solana') {
    return !!_solana.formatAddress(addr)
  } else if (format === 'starknet') {
    // TODO
    return !!addr
  } else if (format === 'ckb') {
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
  } else if (format === 'bitcoin') {
    return _bitcoin.formatAddress(addr)
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
  } else if (format === 'ckb') {
    return _ckb.formatAddress(addr)
  }
}

export const aptos = _aptos
export const bitcoin = _bitcoin
export const ethers = _ethers
export const sui = _sui
export const solana = _solana
export const starknet = _starknet
export const tron = _tron
export const zksync = _zksync
export const ckb = _ckb
