import { providers, Wallet, Signer, Contract } from 'ethers'

export function getWallet(privateKey, provider: providers.Provider) {
  return new Wallet(privateKey, provider)
}

export function getContract(address, abi, wallet: providers.Provider | Signer) {
  return new Contract(address, abi, wallet)
}
