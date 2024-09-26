import {  Wallet as ZkWallet, Contract as ZkContract } from 'zksync-web3'
import ZksyncAdaptor from './ZksyncAdaptor'

export function getWallet(privateKey: string, adaptor: ZksyncAdaptor, Wallet = ZkWallet): ZkWallet {
  return new Wallet(privateKey, adaptor)
}

export function getContract(address: string, abi, wallet: ZksyncAdaptor | ZkWallet) {
  return new ZkContract(address, abi, wallet)
}
