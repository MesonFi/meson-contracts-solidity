import { ECPairFactory } from 'ecpair'
import * as btclib from 'bitcoinjs-lib'
import ecc from '@bitcoinerlab/secp256k1'

import { Swap } from '../../Swap'
import { getSwapId } from '../../utils'
import BtcAdaptor from './BtcAdaptor'
import BtcWallet, { BtcWalletFromExtension } from './BtcWallet'

const ECPair = ECPairFactory(ecc)

export function getWallet(input: string = '', client: BtcAdaptor) {
  if (input.startsWith('0x')) {
    // HEX format
    const buffer = Buffer.from(input.substring(2), 'hex')
    const keypair = ECPair.fromPrivateKey(buffer, { network: client.network })
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

export function getContract(address, abi, clientOrAdaptor: any) {
  let adaptor: BtcAdaptor
  if (clientOrAdaptor instanceof BtcAdaptor) {
    adaptor = clientOrAdaptor
  } else if (clientOrAdaptor instanceof BtcWallet) {
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
      } else if (prop === 'interface') {
        return {
          format: () => abi,
          parseTransaction: tx => {
            // tx.data
            return { name: '', args: [] }
          }
        }
      } else if (['queryFilter', 'on', 'removeAllListeners'].includes(prop)) {
        return () => { }
      } else if (prop === 'connect') {
        return (wallet: BtcWallet) => getContract(address, abi, wallet)
      } else if (prop === 'filters') {
        throw new Error('BtcContract.filters not implemented')
      } else if (prop === 'pendingTokenBalance') {
        return async (tokenIndex: number) => {
        }
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
          return async (...args) => {
            let options
            if (args.length > method.inputs.length) {
              options = args.pop()
            }

            const swap = Swap.decode(args[0])
            if (prop === 'directRelease') {
              const [_encoded, _r, _yParityAndS, _initiator, recipient] = args
              const swapId = getSwapId(_encoded, _initiator)
              return await (adaptor as BtcWallet).sendTransaction({
                swapId,
                to: recipient,
                value: swap.amount.sub(swap.fee).mul(100).toNumber(),
              })
            } else if (prop === 'directExecuteSwap') {
              return await (adaptor as BtcWallet).sendTransaction({
                to: address,
                value: swap.amount.mul(100).toNumber(),
              })
            } else {
              throw new Error(`Method ${prop} is not implemented.`)
            }
          }
        }
      }
    }
  })
}

export function parseAddress(addr: string) {
  try {
    const result = btclib.address.fromBech32(addr)
    return { addr, format: 'bech32', hex: '0x' + result.data.toString('hex') }
  } catch (e) {}

  try {
    const result = btclib.address.fromBase58Check(addr)
    return { addr, format: 'base58', hex: '0x' + result.hash.toString('hex') }
  } catch (e) {}
}

export function formatAddress(addr: string) {
  return parseAddress(addr)?.addr
}
