import TronWeb from 'tronweb'

import TronAdaptor from './TronAdaptor'
import TronWallet from './TronWallet'
import TronContract from './TronContract'
import { FailoverTronAdaptor } from '../FailoverAdaptors'

export function getWallet(privateKey: string, adaptor: TronAdaptor, Wallet = TronWallet): TronWallet {
  if (privateKey.startsWith('0x')) {
    privateKey = privateKey.substring(2)
  }
  let injectedAdaptor
  if (adaptor['adaptors']) {
    injectedAdaptor = new FailoverTronAdaptor(...adaptor['adaptors'].map(adp => _injectPrivateKey(privateKey, adp)))
  } else {
    injectedAdaptor = _injectPrivateKey(privateKey, adaptor)
  }
  return new Wallet(injectedAdaptor)
}

function _injectPrivateKey(privateKey: string, adaptor: TronAdaptor): TronAdaptor {
  return new TronAdaptor(new TronWeb({ fullHost: adaptor.client.fullNode.host, privateKey }))
}

export function getWalletFromExtension(adaptor: TronAdaptor): TronWallet {
  return new TronWallet(adaptor)
}

export function getContract(address: string, abi, adaptor: TronAdaptor) {
  return new TronContract(address, abi, adaptor)
}
