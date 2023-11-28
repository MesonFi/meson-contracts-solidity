import TronWeb from 'tronweb'

import TronAdaptor from './TronAdaptor'
import TronWallet from './TronWallet'
import TronContract from './TronContract'

export function getWallet(privateKey: string, client: TronWeb) {
  if (privateKey.startsWith('0x')) {
    privateKey = privateKey.substring(2)
  }
  return new TronWallet(new TronWeb({
    fullHost: client.fullNode.host,
    privateKey
  }))
}

export function getWalletFromExtension(client: TronWeb): TronWallet {
  return new TronWallet(client)
}

export function getContract(address, abi, clientOrAdaptor: TronWeb | TronAdaptor) {
  return new TronContract(address, abi, clientOrAdaptor)
}
