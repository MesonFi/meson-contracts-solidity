import { providers, Signer, utils } from 'ethers'
import TronWeb from 'tronweb'
import { Wallet as ZkWallet } from 'zksync-web3'

import { IAdaptor } from './types'

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

export function getWallet (privateKey: string, adaptor: IAdaptor, Wallet?) {
  if (adaptor instanceof ZksyncAdaptor) {
    return _zksync.getWallet(privateKey, adaptor, Wallet)
  } else if (adaptor instanceof EthersAdaptor || adaptor instanceof providers.JsonRpcProvider) {
    return _ethers.getWallet(privateKey, adaptor, Wallet)
  } else if (adaptor instanceof AptosAdaptor) {
    return _aptos.getWallet(privateKey, adaptor, Wallet)
  } else if (adaptor instanceof BtcAdaptor) {
    return _bitcoin.getWallet(privateKey, adaptor, Wallet)
  } else if (adaptor instanceof CkbAdaptor) {
    return _ckb.getWallet(privateKey, adaptor, Wallet)
  } else if (adaptor instanceof SolanaAdaptor) {
    return _solana.getWallet(privateKey, adaptor, Wallet)
  } else if (adaptor instanceof StarkAdaptor) {
    return _starknet.getWallet(privateKey, adaptor)
  } else if (adaptor instanceof SuiAdaptor) {
    return _sui.getWallet(privateKey, adaptor, Wallet)
  } else if (adaptor instanceof TronAdaptor) {
    return _tron.getWallet(privateKey, adaptor, Wallet)
  } else {
    throw new Error('Unknown adaptor')
  }
}

export function getContract(address: string, abi, adaptor: IAdaptor | Signer) {
  if (adaptor instanceof ZksyncAdaptor || adaptor instanceof ZkWallet) {
    return _zksync.getContract(address, abi, adaptor)
  } else if (adaptor instanceof EthersAdaptor || adaptor instanceof providers.JsonRpcProvider || Signer.isSigner(adaptor)) {
    return _ethers.getContract(address, abi, adaptor)
  } else if (adaptor instanceof AptosAdaptor) {
    return _aptos.getContract(address, abi, adaptor)
  } else if (adaptor instanceof BtcAdaptor) {
    return _bitcoin.getContract(address, abi, adaptor)
  } else if (adaptor instanceof CkbAdaptor) {
    return _ckb.getContract(address, abi, adaptor)
  } else if (adaptor instanceof SolanaAdaptor) {
    return _solana.getContract(address, abi, adaptor)
  } else if (adaptor instanceof StarkAdaptor) {
    return _starknet.getContract(address, abi, adaptor)
  } else if (adaptor instanceof SuiAdaptor) {
    return _sui.getContract(address, abi, adaptor)
  } else if (adaptor instanceof TronAdaptor) {
    return _tron.getContract(address, abi, adaptor)
  } else {
    throw new Error('Unknown adaptor')
  }
}

export function getFailoverAdaptor(adps: IAdaptor[]) {
  if (!adps.length) {
    throw new Error('Empty clients')
  }
  if (adps.every(a => a instanceof ZksyncAdaptor)) {
    return new FailoverZksyncAdaptor(...adps as ZksyncAdaptor[])
  } else if (adps.every(a => a instanceof EthersAdaptor)) {
    return new FailoverEthersAdaptor(...adps as EthersAdaptor[])
  } else if (adps.every(a => a instanceof AptosAdaptor)) {
    return new FailoverAptosAdaptor(...adps as AptosAdaptor[])
  } else if (adps.every(a => a instanceof BtcAdaptor)) {
    return new FailoverBtcAdaptor(...adps as BtcAdaptor[])
  } else if (adps.every(a => a instanceof CkbAdaptor)) {
    return new FailoverCkbAdaptor(...adps as CkbAdaptor[])
  } else if (adps.every(a => a instanceof SolanaAdaptor)) {
    return new FailoverSolanaAdaptor(...adps as SolanaAdaptor[])
  } else if (adps.every(a => a instanceof StarkAdaptor)) {
    return new FailoverStarkAdaptor(...adps as StarkAdaptor[])
  } else if (adps.every(a => a instanceof SuiAdaptor)) {
    return new FailoverSuiAdaptor(...adps as SuiAdaptor[])
  } else if (adps.every(a => a instanceof TronAdaptor)) {
    return new FailoverTronAdaptor(...adps as TronAdaptor[])
  } else {
    throw new Error('Conflicting clients')
  }
}

export type AddressFormat = 'ethers' | 'aptos' | 'bitcoin' | 'ckb' | 'solana' | 'starknet' | 'sui' | 'tron'
export function isAddress(format: AddressFormat, addr: string): boolean {
  if (format === 'ethers') {
    return utils.isHexString(addr) && utils.isAddress(addr)
  } else if (format === 'aptos' || format === 'sui') {
    return utils.isHexString(addr) && addr.length <= 66 && addr.length > 50
  } else if (format === 'bitcoin') {
    return !!_bitcoin.formatAddress(addr)
  } else if (format === 'ckb') {
    // TODO
    return !!addr
  } else if (format === 'solana') {
    return !!_solana.formatAddress(addr)
  } else if (format === 'starknet') {
    // TODO
    return !!addr
  } else if (format === 'tron') {
    return TronWeb.isAddress(addr)
  }
}

export function formatAddress(format: AddressFormat, addr: string): string {
  if (format === 'ethers') {
    if (utils.isAddress(addr)) {
      return utils.getAddress(addr).toLowerCase()
    } else {
      return addr
    }
  } else if (format === 'aptos') {
    return _aptos.formatAddress(addr)
  } else if (format === 'bitcoin') {
    return _bitcoin.formatAddress(addr)
  } else if (format === 'ckb') {
    return _ckb.formatAddress(addr)
  } else if (format === 'solana') {
    return _solana.formatAddress(addr)
  } else if (format === 'starknet') {
    return _starknet.formatAddress(addr)
  } else if (format === 'sui') {
    return _sui.formatAddress(addr)
  } else if (format === 'tron') {
    return TronWeb.address.fromHex(addr)
  }
}

export const ethers = _ethers
export const aptos = _aptos
export const bitcoin = _bitcoin
export const ckb = _ckb
export const solana = _solana
export const starknet = _starknet
export const sui = _sui
export const tron = _tron
export const zksync = _zksync
