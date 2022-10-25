import TronWeb from 'tronweb'

import TronAdaptor from './TronAdaptor'
import TronWallet from './TronWallet'
import TronContract from './TronContract'

export function getWallet(privateKey, client: TronWeb) {
  return new TronWallet(new TronWeb({
    fullHost: client.fullNode.host,
    privateKey
  }))
}

export function getContract(address, abi, clientOrAdaptor: TronWeb | TronAdaptor) {
  return new TronContract(address, abi, clientOrAdaptor)
}
