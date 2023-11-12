import { BigNumber, BigNumberish, utils } from 'ethers'
import sol from '@solana/web3.js'
import memoize from 'lodash/memoize'

import SolanaAdaptor from './SolanaAdaptor'
import SolanaWallet, { SolanaExtWallet } from './SolanaWallet'
import { Swap } from '../../Swap'

export function getWallet(privateKey: string, client: sol.Connection): SolanaWallet {
  let keypair: sol.Keypair
  if (!privateKey) {
    keypair = sol.Keypair.generate()
  } else if (Array.isArray(privateKey)) { // specific for solana
    keypair = sol.Keypair.fromSecretKey(new Uint8Array(privateKey))
  } else if (privateKey.startsWith('0x')) {
    keypair = sol.Keypair.fromSeed(utils.arrayify(privateKey))
  } else { // mnemonics
    throw new Error('Get Solana wallet from mnemonics not implemented')
  }
  return new SolanaWallet(client, keypair)
}

export function getWalletFromExtension(ext, client: sol.Connection): SolanaExtWallet {
  return new SolanaExtWallet(client, ext)
}

export function getContract(address, abi, clientOrAdaptor: sol.Connection | SolanaAdaptor) {
  let adaptor: SolanaAdaptor
  if (clientOrAdaptor instanceof SolanaWallet) {
    adaptor = clientOrAdaptor
  } else if (clientOrAdaptor instanceof SolanaAdaptor) {
    adaptor = clientOrAdaptor
  } else {
    adaptor = new SolanaAdaptor(clientOrAdaptor)
  }

  return new Proxy({}, {
    get(target, prop: string) {
      if (prop === 'address') {
        return address
      } else if (prop === 'provider') {
        return adaptor
      } else if (prop === 'signer') {
        if (adaptor instanceof SolanaWallet) {
          return adaptor
        }
        throw new Error(`SolanaContract doesn't have a signer.`)
      } else if (prop === 'interface') {
        return {
          format: () => abi,
          parseTransaction: tx => {
          }
        }
      } else if (['queryFilter', 'on', 'removeAllListeners'].includes(prop)) {
        return () => {}
      } else if (prop === 'connect') {
        return (wallet: SolanaWallet) => getContract(address, abi, wallet)
      } else if (prop === 'filters') {
        throw new Error('SolanaContract.filters not implemented')
      } else if (prop === 'call') {
        return async (target, getArguments) => {
        }
      } else if (prop === 'pendingTokenBalance') {
        return async tokenIndex => {
        }
      }

      let method = abi.find(item => item.name === prop)
      if (method?.type === 'function') {
        if (['view', 'pure'].includes(method.stateMutability)) {
          return async (...args) => {
            let options
            if (args.length > method.inputs.length) {
              options = args.pop()
            }

            // ERC20 like
            if (prop === 'name') {
              // const data = await adaptor.client.getCoinMetadata({ coinType: address })
              // return data.name
            } else if (prop === 'symbol') {
              // const data = await adaptor.client.getCoinMetadata({ coinType: address })
              // return data.symbol
            } else if (prop === 'decimals') {
              // const data = await adaptor.client.getCoinMetadata({ coinType: address })
              // return data.decimals
            } else if (prop === 'balanceOf') {
              // const data = await adaptor.client.getBalance({
              //   owner: args[0],
              //   coinType: address,
              // })
              // return BigNumber.from(data.totalBalance)
            } else if (prop === 'allowance') {
              return BigNumber.from(2).pow(128).sub(1)
            }

            // Meson
            if (prop === 'getShortCoinType') {
              return '0x01f5'
            } else if (prop === 'getSupportedTokens') {
              // return await getSupportedTokens()
            } else if (prop === 'ownerOfPool') {
              // return await ownerOfPool(args[0])
            } else if (prop === 'poolOfAuthorizedAddr') {
              // return await poolOfAuthorizedAddr(args[0])
            } else if (prop === 'poolTokenBalance') {
            } else if (prop === 'serviceFeeCollected') {
            } else if (prop === 'getPostedSwap') {
            } else if (prop === 'getLockedSwap') {
            }

            throw new Error(`SolanaContract read not implemented (${prop})`)
          }
        } else {
          return async (...args) => {
            let options
            if (args.length > method.inputs.length) {
              options = args.pop()
            }

            let metadata
            if (prop !== 'transfer') {
              // metadata = await getMetadata()
            }

            if (prop === 'transfer') {
            } else if (prop === 'addSupportToken') {
            } else if (['depositAndRegister', 'deposit'].includes(prop)) {
            } else if (prop === 'withdraw') {
            } else if (['addAuthorizedAddr', 'removeAuthorizedAddr', 'transferPoolOwner'].includes(prop)) {
            } else if (prop === 'withdrawServiceFee') {
            } else {
              const swap = Swap.decode(args[0])
              if (prop === 'postSwapFromInitiator') {
              } else if (prop === 'bondSwap') {
              } else if (prop === 'cancelSwap') {
              } else if (prop === 'executeSwap') {
              } else if (prop === 'lockSwap') {
              } else if (prop === 'unlock') {
              } else if (prop === 'release') {
              } else if (prop === 'directRelease') {
              } else if (prop === 'simpleRelease') {
              }
            }

            // return await (<SolanaWallet>adaptor).sendTransaction(tx, options)
          }
        }
      }
      return target[prop]
    }
  })
}