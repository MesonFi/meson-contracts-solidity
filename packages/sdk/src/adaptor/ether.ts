import { providers, Wallet, Contract } from 'ethers'

export function getWallet(privateKey, provider: providers.Provider) {
  return new Wallet(privateKey, provider)
}

export function getContract(address, abi, wallet: providers.Provider | Wallet) {
  return new Contract(address, abi, wallet)
}
