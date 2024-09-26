import { ethers, providers, Signer } from 'ethers'
import EthersAdaptor from './EthersAdaptor'

export function getWallet(privateKey: string, adaptor: EthersAdaptor | providers.JsonRpcProvider, Wallet = ethers.Wallet): ethers.Wallet {
  if (!privateKey) {
    const wallet = Wallet.createRandom()
    return wallet.connect(adaptor)
  }
  return new Wallet(privateKey, adaptor)
}

export function getContract(address: string, abi, adaptor: EthersAdaptor | providers.JsonRpcProvider | Signer) {
  return new ethers.Contract(address, abi, adaptor)
}
