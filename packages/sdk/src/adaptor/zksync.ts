import { Provider as ZkProvider, Wallet as ZkWallet, Contract as ZkContract } from 'zksync-web3'

export function getWallet(privateKey, provider: ZkProvider) {
  return new ZkWallet(privateKey, provider)
}

export function getContract(address, abi, wallet: ZkProvider | ZkWallet) {
  return new ZkContract(address, abi, wallet)
}
