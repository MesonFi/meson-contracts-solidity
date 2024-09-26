import { providers, Wallet, Signer, Contract } from 'ethers'

export function getWallet(privateKey, provider: providers.Provider) {
  if (!privateKey) {
    const wallet = Wallet.createRandom()
    return wallet.connect(provider)
  }
  return new Wallet(privateKey, provider)
}

export function getContract(address, abi, wallet: providers.Provider | Signer) {
  return new Contract(address, abi, wallet)
}
