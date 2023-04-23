import { BigNumber, BigNumberish, utils } from 'ethers'
import {
  Secp256k1Keypair as SuiKeypair,
  JsonRpcProvider as SuiProvider,
  TransactionBlock,
} from '@mysten/sui.js'

import memoize from 'lodash/memoize'

import SuiAdaptor from './SuiAdaptor'
import SuiWallet, { SuiExtWallet } from './SuiWallet'
import { Swap } from '../../Swap'

export function getWallet(privateKey: string, client: SuiProvider): SuiWallet {
  let keypair
  if (!privateKey) {
    keypair = SuiKeypair.generate()
  } else if (privateKey.startsWith('0x')) {
    keypair = SuiKeypair.fromSecretKey(utils.arrayify(privateKey))
  } else { // mnemonics
    keypair = SuiKeypair.deriveKeypair(privateKey)
  }
  return new SuiWallet(client, keypair)
}

export function getWalletFromExtension(ext, client: SuiProvider): SuiExtWallet {
  return new SuiExtWallet(client, ext)
}

export function getContract(address, abi, clientOrAdaptor: SuiProvider | SuiAdaptor) {
  let adaptor: SuiAdaptor
  if (clientOrAdaptor instanceof SuiWallet) {
    adaptor = clientOrAdaptor
  } else if (clientOrAdaptor instanceof SuiAdaptor) {
    adaptor = clientOrAdaptor
  } else {
    adaptor = new SuiAdaptor(clientOrAdaptor)
  }

  const getSupportedTokens = memoize(async () => {
    const indexes: number[] = []
    const tokens: string[] = []
    for (const i of [1]) {
      indexes.push(i)
      // TODO: temp token on devnet
      tokens.push(`${address}::usdc::USDC`)
    }
    return { tokens, indexes }
  })

  const getTokenAddr = async (tokenIndex: number) => {
    const { tokens, indexes } = await getSupportedTokens()
    const i = indexes.findIndex(i => i === tokenIndex)
    if (i === -1) {
      throw new Error(`Token index ${tokenIndex} not found.`)
    }
    return tokens[i]
  }

  // TODO: What if owner of pool is transferred (although currently unsupported)?
  const ownerOfPool = memoize(async (poolIndex: BigNumberish) => {
    // TODO: temp on devnet
    return '0x74f8b6946f43cf869e82a0a60fd61932ca1e868457e4497b46aace23272476ff'
  }, poolIndex => BigNumber.from(poolIndex).toString())

  const poolOfAuthorizedAddr = memoize(async (addr: string) => {
    // TODO: temp on devnet
    return 1
  })

  return new Proxy({}, {
    get(target, prop: string) {
      if (prop === 'address') {
        return address
      } else if (prop === 'provider') {
        return adaptor
      } else if (prop === 'signer') {
        if (adaptor instanceof SuiWallet) {
          return adaptor
        }
        throw new Error(`SuiContract doesn't have a signer.`)
      } else if (prop === 'interface') {
        return {
          format: () => abi,
          parseTransaction: tx => {
            let moveCalls
            try {
              moveCalls = JSON.parse(tx.data)
            } catch (e) {
              throw new Error('Failed to parse sui tx data')
            }
            if (!moveCalls || moveCalls.length !== 1) {
              throw new Error('Failed to determine sui tx content')
            }

            const { target, arguments: rawArgs } = moveCalls[0]
            const name = target.split('::')[2]

            const args: any = { encodedSwap: rawArgs[0] }
            switch (name) {
              case 'bondSwap':
              case 'cancelSwap':
                break
              case 'lock':
                args.initiator = rawArgs[2]
                break
              case 'unlock':
                args.initiator = rawArgs[1]
                break
              case 'postSwap':
                args.postingValue = BigNumber.from(utils.solidityPack(['address', 'uint40'], [rawArgs[2], rawArgs[3]]))
                break
              case 'executeSwap':
                args.recipient = rawArgs[2]
                break
              case 'release':
                args.initiator = rawArgs[2]
                break
            }
            if (['postSwap', 'executeSwap', 'lock', 'release'].includes(name)) {
              const { r, yParityAndS } = utils.splitSignature(rawArgs[1])
              args.r = r
              args.yParityAndS = yParityAndS
            }
            return { name, args }
          }
        }
      } else if (['queryFilter', 'on', 'removeAllListeners'].includes(prop)) {
        return () => {}
      } else if (prop === 'connect') {
        return (wallet: SuiWallet) => getContract(address, abi, wallet)
      } else if (prop === 'filters') {
        throw new Error('SuiContract.filters not implemented')
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
              return 'USD Coin'
            } else if (prop === 'symbol') {
              return 'USDC'
            } else if (prop === 'decimals') {
              return 6
            } else if (prop === 'balanceOf') {
              const data = await adaptor.client.getBalance({
                owner: args[0],
                coinType: address,
              })
              return BigNumber.from(data.totalBalance)
            } else if (prop === 'allowance') {
              return BigNumber.from(2).pow(128).sub(1)
            }

            // Meson
            if (prop === 'getShortCoinType') {
              return '0x0310'
            } else if (prop === 'getSupportedTokens') {
              return await getSupportedTokens()
            } else if (prop === 'ownerOfPool') {
              return await ownerOfPool(args[0])
            } else if (prop === 'poolOfAuthorizedAddr') {
              return await poolOfAuthorizedAddr(args[0])
            } else if (prop === 'poolTokenBalance') {
              const [token, poolOwner] = args
              const data = '' // await memoizedGetResource(address, `${address}::MesonStates::StoreForCoin<${token}>`)
              const result = '' // await readTable(data.in_pool_coins.handle, {
              //   key_type: 'u64',
              //   value_type: `0x1::coin::Coin<${token}>`,
              //   key: (await poolOfAuthorizedAddr(poolOwner)).toString()
              // })
              // return BigNumber.from(result?.value || 0)
              return BigNumber.from(2).pow(128).sub(1)
            } else if (prop === 'getPostedSwap') {
              const data = '' // await memoizedGetResource(address, `${address}::MesonStates::GeneralStore`)
              const result = '' // await readTable(data.posted_swaps.handle, {
              //   key_type: 'vector<u8>',
              //   value_type: `${address}::MesonStates::PostedSwap`,
              //   key: `${Swap.decode(args[0]).encoded}ff`
              // })
              // const exist = !!(result && result.from_address !== '0x0')
              // return {
              //   initiator: exist ? result.initiator : undefined,
              //   poolOwner: exist ? await ownerOfPool(result.pool_index) : undefined,
              //   exist
              // }
            } else if (prop === 'getLockedSwap') {
              // const data = await memoizedGetResource(address, `${address}::MesonStates::GeneralStore`)
              // const result = await readTable(data.locked_swaps.handle, {
              //   key_type: 'vector<u8>',
              //   value_type: `${address}::MesonStates::LockedSwap`,
              //   key: _getSwapId(Swap.decode(args[0]).encoded, args[1])
              // })
              const result = {
                until: Math.floor(Date.now() / 1000) + 6400,
                pool_index: '1'
              }
              // if (!result) {
              //   return { until: 0 } // never locked
              // } else if (!Number(result.until)) {
              //   return { until: 0, poolOwner: '0x1' } // locked & released
              // }
              return {
                until: Number(result.until),
                poolOwner: await ownerOfPool(result.pool_index)
              }
            }

            throw new Error(`SuiContract read not implemented (${prop})`)
          }
        } else {
          return async (...args) => {
            let options
            if (args.length > method.inputs.length) {
              options = args.pop()
            }

            const tx = new TransactionBlock()
            const module = _findMesonMethodModule(prop)
            const payload = {
              target: `${address}::${module}::${prop}`,
              arguments: [],
              typeArguments: [],
            }

            if (prop === 'transfer') {
              const [to, amount] = args
              payload.target = '0x1::coin::transfer'
              payload.arguments = [to, BigNumber.from(amount).toString()]
            }

            if (['depositAndRegister', 'deposit', 'withdraw'].includes(prop)) {
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toHexString()
              payload.typeArguments = [await getTokenAddr(tokenIndex)]
              payload.arguments = [
                tx.pure(BigNumber.from(args[0]).toHexString()),
                tx.pure(poolIndex)
              ]
            } else if (['addAuthorizedAddr', 'removeAuthorizedAddr'].includes(prop)) {
              payload.arguments = [args[0]]
            } else {
              const swap = Swap.decode(args[0])
              if (prop === 'postSwap') {
                const [_, r, yParityAndS, postingValue] = args
                payload.typeArguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [
                  tx.pure(_vectorize(swap.encoded)),
                  tx.pure(_getCompactSignature(r, yParityAndS)),
                  tx.pure(_vectorize(postingValue.substring(0, 42))), // initiator
                  tx.pure(`0x${postingValue.substring(42)}`) // pool_index
                ]
              } else if (prop === 'bondSwap') {
                payload.typeArguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [tx.pure(_vectorize(swap.encoded)), tx.pure(args[1].toString())]
              } else if (prop === 'cancelSwap') {
                payload.typeArguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [tx.pure(_vectorize(swap.encoded))]
              } else if (prop === 'executeSwap') {
                const [_, r, yParityAndS, recipient, depositToPool] = args
                payload.typeArguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [
                  tx.pure(_vectorize(swap.encoded)),
                  tx.pure(_getCompactSignature(r, yParityAndS)),
                  tx.pure(_vectorize(recipient.substring(0, 42))),
                  tx.pure(depositToPool)
                ]
              } else if (prop === 'lock') {
                const [_, r, yParityAndS, { initiator, recipient }] = args
                payload.typeArguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  tx.pure(_vectorize(swap.encoded)),
                  tx.pure(_getCompactSignature(r, yParityAndS)),
                  tx.pure(_vectorize(initiator)),
                  tx.pure(recipient)
                ]
              } else if (prop === 'unlock') {
                const [_, initiator] = args
                payload.typeArguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  tx.pure(_vectorize(swap.encoded)),
                  tx.pure(_vectorize(initiator))
                ]
              } else if (prop === 'release') {
                payload.target = `${address}::usdc::release`

                const [_, r, yParityAndS, initiator] = args
                // payload.typeArguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  tx.pure(_vectorize(swap.encoded)),
                  tx.pure(_getCompactSignature(r, yParityAndS)),
                  tx.pure(_vectorize(initiator)),
                  tx.object('0x1214501fc9024b5020725c09f2d687ef91cc833394da158014cd9237fa2eab17'),
                  tx.object('0xadb80bec1c09d1653fc103d204984c23ae2fd3f0e39a11620f1c8a25f1cd4a89'),
                ]
              }
            }

            tx.moveCall(<any>payload)

            if (prop !== 'release') {
              options = { mock: true }
            }
            return await (<SuiWallet>adaptor).sendTransaction(tx, options)
          }
        }
      }
      return target[prop]
    }
  })
}

function _findMesonMethodModule(method) {
  const moduleMethods = {
    MesonPools: [
      'depositAndRegister',
      'deposit',
      'withdraw',
      'addAuthorizedAddr',
      'removeAuthorizedAddr',
      'lock',
      'unlock',
      'release'
    ],
    MesonSwap: ['postSwap', 'bondSwap', 'cancelSwap', 'executeSwap'],
  }

  for (const module of Object.keys(moduleMethods)) {
    if (moduleMethods[module].includes(method)) {
      return module
    }
  }
}

function _vectorize(hex: string) {
  return Array.from(utils.arrayify(hex))
}

function _getSwapId(encoded, initiator) {
  const packed = utils.solidityPack(['bytes32', 'address'], [encoded, initiator])
  return utils.keccak256(packed)
}

function _getCompactSignature(r: string, yParityAndS: string) {
  return _vectorize(r + yParityAndS.replace(/^0x/, ''))
}
