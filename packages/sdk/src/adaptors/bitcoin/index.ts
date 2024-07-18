import bs58check from 'bs58check'
import { ECPairFactory } from 'ecpair'
import * as tinysecp from 'tiny-secp256k1'

import { getSwapId } from '../../utils'
import { Swap } from '../../Swap'
import BtcAdaptor from './BtcAdaptor'
import BtcWallet, { BtcWalletFromExtension } from './BtcWallet'

const ECPair = ECPairFactory(tinysecp)

export function getWallet(input: string = '', client: BtcAdaptor) {
  if (input.startsWith('0x')) {
    // HEX format
    const buffer = Buffer.from([client.network.wif, ...Buffer.from(input.substring(2), 'hex')])
    const wif = bs58check.encode(buffer)
    console.log(wif)
    const keypair = ECPair.fromWIF(wif, client.network)
    return new BtcWallet(client, keypair)
  } else if (input) {
    // WIF format
    const keypair = ECPair.fromWIF(input, client.network)
    return new BtcWallet(client, keypair)
  }
}

export function getWalletFromExtension(ext, client: BtcAdaptor): BtcWalletFromExtension {
  return new BtcWalletFromExtension(client, ext)
}

export function getContract(address, abi, clientOrAdaptor: BtcAdaptor) {
  let adaptor: BtcAdaptor
  if (clientOrAdaptor instanceof BtcAdaptor) {
    adaptor = clientOrAdaptor
  } else {
    adaptor = new BtcAdaptor(clientOrAdaptor)
  }

  return new Proxy({}, {
    get(target, prop: string) {
      if (prop === 'address') {
        return address
      } else if (prop === 'provider') {
        return adaptor
      } else if (prop === 'signer') {
        if (adaptor instanceof BtcWallet) {
          return adaptor
        }
        throw new Error(`BtcContract doesn't have a signer.`)
      } 

      let method = abi.find(item => item.name === prop)
      if (method?.type === 'function') {

        if (['view', 'pure'].includes(method.stateMutability)) {
          return async (...args) => {
            // Meson
            if (prop === 'getShortCoinType') {
              return '0x0000'
            } else if (prop === 'getSupportedTokens') {
              return { tokens: [], indexes: [] }
            }
          }
        } else {

        }
      }
    }
  })
}