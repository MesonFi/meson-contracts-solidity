import { BigNumber, BigNumberish, utils } from 'ethers'
import { AptosAccount } from 'aptos'
import memoize from 'lodash/memoize'

import { getSwapId } from '../../utils'
import { Swap } from '../../Swap'
import AptosAdaptor from './AptosAdaptor'
import AptosWallet, { AptosExtWallet } from './AptosWallet'

export function getWallet(privateKey: string, adaptor: AptosAdaptor, Wallet = AptosWallet): AptosWallet {
  if (privateKey && !privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey
  }
  const signer = new AptosAccount(privateKey && utils.arrayify(privateKey))
  return new Wallet(adaptor, signer)
}

export function getWalletFromExtension(ext, adaptor: AptosAdaptor): AptosExtWallet {
  return new AptosExtWallet(adaptor, ext)
}

export function getContract(address: string, abi, adaptor: AptosAdaptor) {
  const getResource = async (addr: string, type: string) => {
    try {
      const result = await adaptor.client.getAccountResource(addr, type)
      return result.data as any
    } catch (e) {
      if (e.errors) {
        e = e.errors[0]
      }
      if (e.errorCode === 'resource_not_found') {
        return
      }
      throw e
    }
  }
  const memoizedGetResource = memoize(getResource, (addr: string, type: string) => `${addr}|${type}`)

  const readTable = async (handle: string, data: { key_type: string, value_type: string, key: any }) => {
    try {
      return await adaptor.client.getTableItem(handle, data)
    } catch (e) {
      if (e.errors) {
        e = e.errors[0]
      }
      if (e.errorCode === 'table_item_not_found') {
        return
      }
      throw e
    }
  }

  const getSupportedTokens = memoize(async () => {
    const data = await memoizedGetResource(address, `${address}::MesonStates::GeneralStore`)
    const indexes: number[] = []
    const tokens: string[] = []
    for (const i of [1, 2, 255]) {
      const result = await readTable(data.supported_coins.handle, {
        key_type: 'u8',
        value_type: '0x1::type_info::TypeInfo',
        key: i
      })
      if (!result) {
        continue
      }
      const { account_address, module_name, struct_name } = result
      indexes.push(i)
      tokens.push([
        utils.hexZeroPad(account_address, 32),
        utils.toUtf8String(module_name),
        utils.toUtf8String(struct_name)
      ].join('::'))
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

  // TODO: What if owner of pool is transferred?
  const ownerOfPool = async (poolIndex: BigNumberish) => {
    const data = await memoizedGetResource(address, `${address}::MesonStates::GeneralStore`)
    return await readTable(data.pool_owners.handle, {
      key_type: 'u64',
      value_type: 'address',
      key: BigNumber.from(poolIndex).toString()
    })
  }

  const poolOfAuthorizedAddr = async (addr: string) => {
    const data = await memoizedGetResource(address, `${address}::MesonStates::GeneralStore`)
    return +await readTable(data.pool_of_authorized_addr.handle, {
      key_type: 'address',
      value_type: 'u64',
      key: addr
    }) || 0
  }

  return new Proxy({}, {
    get(target, prop: string) {
      if (prop === 'address') {
        return address
      } else if (prop === 'provider') {
        return adaptor
      } else if (prop === 'signer') {
        if (adaptor instanceof AptosWallet) {
          return adaptor
        }
        throw new Error(`AptosContract doesn't have a signer.`)
      } else if (prop === 'interface') {
        return {
          format: () => abi,
          parseTransaction: tx => {
            const payload = JSON.parse(tx.data)
            if (payload.type !== 'entry_function_payload') {
              throw new Error(`Payload type ${payload.type} unsupported`)
            }
            const { function: fun, arguments: rawArgs } = payload
            const name = fun.split('::')[2]
            const args: any = { encodedSwap: rawArgs[0].replace('0x20', '0x') }
            switch (name) {
              case 'postSwapFromInitiator': {
                const poolIndex = rawArgs[2].startsWith('0x')
                  ? new DataView(utils.arrayify(rawArgs[2]).buffer).getBigUint64(0, true).toString()
                  : rawArgs[2]
                let initiator = rawArgs[1]
                if (initiator.length === 44) {
                  initiator = initiator.replace('0x14', '0x')
                }
                args.postingValue = BigNumber.from(utils.solidityPack(['address', 'uint40'], [initiator, poolIndex]))
                break
              }
              case 'bondSwap':
              case 'cancelSwap':
                break
              case 'lockSwap':
              case 'unlock':
                args.initiator = rawArgs[1]
                if (args.initiator.length === 44) {
                  args.initiator = args.initiator.replace('0x14', '0x')
                }
                break
              case 'executeSwap':
                args.recipient = rawArgs[2]
                if (args.recipient.length === 44) {
                  args.recipient = args.recipient.replace('0x14', '0x')
                }
                break
              case 'release':
                args.initiator = rawArgs[2]
                if (args.initiator.length === 44) {
                  args.initiator = args.initiator.replace('0x14', '0x')
                }
                break
              case 'directRelease':
                args.initiator = rawArgs[2]
                args.recipient = rawArgs[3]
                break
            }
            if (['executeSwap', 'release', 'directRelease'].includes(name)) {
              let signature = rawArgs[1]
              if (signature.length === 132) {
                signature = signature.replace('0x40', '0x')
              }
              const { r, yParityAndS } = utils.splitSignature(signature)
              args.r = r
              args.yParityAndS = yParityAndS
            }
            return { name, args }
          }
        }
      } else if (['queryFilter', 'on', 'removeAllListeners'].includes(prop)) {
        return () => {}
      } else if (prop === 'connect') {
        return (wallet: AptosWallet) => getContract(address, abi, wallet)
      } else if (prop === 'filters') {
        throw new Error('AptosContract.filters not implemented')
      } else if (prop === 'pendingTokenBalance') {
        return async tokenIndex => {
          const tokenAddr = await getTokenAddr(tokenIndex)
          const data = await memoizedGetResource(address, `${address}::MesonStates::StoreForCoin<${tokenAddr}>`)
          const result = await readTable(data.pending_coins.handle, {
            key_type: 'u64',
            value_type: `0x1::coin::Coin<${tokenAddr}>`,
            key: '0'
          })
          return BigNumber.from(0)
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
            if (['name', 'symbol', 'decimals'].includes(prop)) {
              const account = address.split('::')[0]
              const data = await memoizedGetResource(account, `0x1::coin::CoinInfo<${address}>`)
              return data?.[prop]
            } else if (prop === 'balanceOf') {
              const data = await getResource(args[0], `0x1::coin::CoinStore<${address}>`)
              return BigNumber.from(data?.coin.value || 0)
            } else if (prop === 'allowance') {
              return BigNumber.from(2).pow(128).sub(1)
            }

            // Meson
            if (prop === 'getShortCoinType') {
              return '0x027d'
            } else if (prop === 'getSupportedTokens') {
              return await getSupportedTokens()
            } else if (prop === 'ownerOfPool') {
              return await ownerOfPool(args[0])
            } else if (prop === 'poolOfAuthorizedAddr') {
              return await poolOfAuthorizedAddr(args[0])
            } else if (prop === 'poolTokenBalance') {
              const [token, poolOwner] = args
              const poolIndex = await poolOfAuthorizedAddr(poolOwner)
              if (!poolIndex) {
                return BigNumber.from(0)
              }
              const data = await memoizedGetResource(address, `${address}::MesonStates::StoreForCoin<${token}>`)
              const result = await readTable(data.in_pool_coins.handle, {
                key_type: 'u64',
                value_type: `0x1::coin::Coin<${token}>`,
                key: poolIndex.toString()
              })
              return BigNumber.from(result?.value || 0)
            } else if (prop === 'serviceFeeCollected') {
              const [tokenIndex] = args
              const tokenAddr = await getTokenAddr(tokenIndex)
              const data = await memoizedGetResource(address, `${address}::MesonStates::StoreForCoin<${tokenAddr}>`)
              const result = await readTable(data.in_pool_coins.handle, {
                key_type: 'u64',
                value_type: `0x1::coin::Coin<${tokenAddr}>`,
                key: '0'
              })
              return BigNumber.from(result?.value || 0)
            } else if (prop === 'getPostedSwap') {
              const data = await memoizedGetResource(address, `${address}::MesonStates::GeneralStore`)
              const result = await readTable(data.posted_swaps.handle, {
                key_type: 'vector<u8>',
                value_type: `${address}::MesonStates::PostedSwap`,
                key: `${Swap.decode(args[0]).encoded}ff`
              })
              if (!result) {
                return { exist: false }
              }
              const pending = result.from_address !== '0x0'
              return {
                initiator: pending ? result.initiator : undefined,
                poolOwner: pending ? await ownerOfPool(result.pool_index) : undefined,
                exist: true
              }
            } else if (prop === 'getLockedSwap') {
              const data = await memoizedGetResource(address, `${address}::MesonStates::GeneralStore`)
              const result = await readTable(data.locked_swaps.handle, {
                key_type: 'vector<u8>',
                value_type: `${address}::MesonStates::LockedSwap`,
                key: getSwapId(Swap.decode(args[0]).encoded, args[1])
              })
              if (!result) {
                return { until: 0 } // never locked
              } else if (!Number(result.until)) {
                return { until: 0, poolOwner: '0x1' } // locked & released
              }
              return {
                until: Number(result.until),
                poolOwner: await ownerOfPool(result.pool_index)
              }
            }

            throw new Error(`AptosContract read not implemented (${prop})`)
          }
        } else {
          return async (...args) => {
            let options
            if (args.length > method.inputs.length) {
              options = args.pop()
            }

            const module = _findMesonMethodModule(prop)
            const payload = {
              function: `${address}::${module}::${prop}`,
              type_arguments: [],
              arguments: []
            }

            if (prop === 'transfer') {
              const [to, amount] = args
              payload.function = '0x1::coin::transfer'
              payload.type_arguments = [address]
              payload.arguments = [to, BigNumber.from(amount).toString()]
            } else if (prop === 'addSupportToken') {
              const [tokenAddr, tokenIndex] = args
              payload.type_arguments = [tokenAddr]
              payload.arguments = [tokenIndex]
            } else if (['depositAndRegister', 'deposit', 'withdraw'].includes(prop)) {
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toHexString()
              payload.type_arguments = [await getTokenAddr(tokenIndex)]
              payload.arguments = [BigNumber.from(args[0]).toHexString(), poolIndex]
            } else if (['addAuthorizedAddr', 'removeAuthorizedAddr', 'transferPoolOwner'].includes(prop)) {
              payload.arguments = [args[0]]
            } else if (prop === 'withdrawServiceFee') {
              const [tokenIndex, amount, toPoolIndex] = args
              payload.type_arguments = [await getTokenAddr(tokenIndex)]
              payload.arguments = [BigNumber.from(amount).toHexString(), toPoolIndex]
            } else {
              const swap = Swap.decode(args[0])
              if (prop === 'postSwapFromInitiator') {
                const [_, postingValue] = args
                payload.type_arguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [
                  _vectorize(swap.encoded),
                  _vectorize(postingValue.substring(0, 42)), // initiator
                  `0x${postingValue.substring(42)}` // pool_index
                ]
              } else if (prop === 'bondSwap') {
                payload.type_arguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [_vectorize(swap.encoded), args[1].toString()]
              } else if (prop === 'cancelSwap') {
                payload.type_arguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [_vectorize(swap.encoded)]
              } else if (prop === 'executeSwap') {
                const [_, r, yParityAndS, recipient, depositToPool] = args
                payload.type_arguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [
                  _vectorize(swap.encoded),
                  _getCompactSignature(r, yParityAndS),
                  _vectorize(recipient.substring(0, 42)),
                  depositToPool
                ]
              } else if (prop === 'lockSwap') {
                const [_, { initiator, recipient }] = args
                payload.type_arguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  _vectorize(swap.encoded),
                  _vectorize(initiator),
                  recipient
                ]
              } else if (prop === 'unlock') {
                const [_, initiator] = args
                payload.type_arguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  _vectorize(swap.encoded),
                  _vectorize(initiator)
                ]
              } else if (prop === 'release') {
                const [_, r, yParityAndS, initiator] = args
                payload.type_arguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  _vectorize(swap.encoded),
                  _getCompactSignature(r, yParityAndS),
                  _vectorize(initiator)
                ]
              } else if (prop === 'directRelease') {
                const [_, r, yParityAndS, initiator, recipient] = args
                payload.type_arguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  _vectorize(swap.encoded),
                  _getCompactSignature(r, yParityAndS),
                  _vectorize(initiator),
                  recipient
                ]
              }
            }

            return await (adaptor as AptosWallet).sendTransaction(payload, options)
          }
        }
      }
      return target[prop]
    }
  })
}

function _findMesonMethodModule(method) {
  const moduleMethods = {
    MesonStates: ['addSupportToken'],
    MesonPools: [
      'depositAndRegister',
      'deposit',
      'withdraw',
      'addAuthorizedAddr',
      'removeAuthorizedAddr',
      'transferPoolOwner',
      'withdrawServiceFee',
      'lockSwap',
      'unlock',
      'release',
      'directRelease',
    ],
    MesonSwap: ['postSwapFromInitiator', 'bondSwap', 'cancelSwap', 'executeSwap'],
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

function _getCompactSignature(r: string, yParityAndS: string) {
  return _vectorize(r + yParityAndS.replace(/^0x/, ''))
}

export function formatAddress(addr: string) {
  const parts = addr.split('::')
  if (!parts[0].startsWith('0x')) {
    parts[0] = '0x' + parts[0]
  }
  parts[0] = utils.hexZeroPad(parts[0], 32)
  return parts.join('::')
}
