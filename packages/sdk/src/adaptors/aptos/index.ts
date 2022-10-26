import { BigNumber, BigNumberish, utils } from 'ethers'
import { AptosClient, AptosAccount } from 'aptos'
import memoize from 'lodash/memoize'

import AptosAdaptor from './AptosAdaptor'
import AptosWallet, { AptosExtWallet } from './AptosWallet'
import { Swap } from '../../Swap'

export function getWallet(privateKey: string, client: AptosClient): AptosWallet {
  if (privateKey && !privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey
  }
  const signer = new AptosAccount(privateKey && utils.arrayify(privateKey))
  return new AptosWallet(client, signer)
}

export function getWalletFromExtension(ext, client: AptosClient): AptosExtWallet {
  return new AptosExtWallet(client, ext)
}

export function getContract(address, abi, clientOrAdaptor: AptosClient | AptosAdaptor) {
  let adaptor: AptosAdaptor
  if (clientOrAdaptor instanceof AptosWallet) {
    adaptor = clientOrAdaptor
  } else if (clientOrAdaptor instanceof AptosAdaptor) {
    adaptor = clientOrAdaptor
  } else {
    adaptor = new AptosAdaptor(clientOrAdaptor)
  }

  const getResource = async (addr: string, type: string) => {
    try {
      const result = await adaptor.client.getAccountResource(addr, type)
      return result.data as any
    } catch (e) {
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

  // TODO: What if owner of pool is transferred (although currently unsupported)?
  const ownerOfPool = memoize(async (poolIndex: BigNumberish) => {
    const data = await memoizedGetResource(address, `${address}::MesonStates::GeneralStore`)
    return await readTable(data.pool_owners.handle, {
      key_type: 'u64',
      value_type: 'address',
      key: BigNumber.from(poolIndex).toString()
    })
  }, poolIndex => BigNumber.from(poolIndex).toString())

  const poolOfAuthorizedAddr = memoize(async (addr: string) => {
    const data = await memoizedGetResource(address, `${address}::MesonStates::GeneralStore`)
    return +await readTable(data.pool_of_authorized_addr.handle, {
      key_type: 'address',
      value_type: 'u64',
      key: addr
    }) || 0
  })

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
            if (['postSwap', 'executeSwap', 'release'].includes(name)) {
              const { r, s, v } = utils.splitSignature(rawArgs[1])
              args.r = r
              args.s = s
              args.v = v
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
              const data = await memoizedGetResource(address, `${address}::MesonStates::StoreForCoin<${token}>`)
              const result = await readTable(data.in_pool_coins.handle, {
                key_type: 'u64',
                value_type: `0x1::coin::Coin<${token}>`,
                key: (await poolOfAuthorizedAddr(poolOwner)).toString()
              })
              return BigNumber.from(result?.value || 0)
            } else if (prop === 'getPostedSwap') {
              const data = await memoizedGetResource(address, `${address}::MesonStates::GeneralStore`)
              const result = await readTable(data.posted_swaps.handle, {
                key_type: 'vector<u8>',
                value_type: `${address}::MesonStates::PostedSwap`,
                key: `${Swap.decode(args[0]).encoded}ff`
              })
              const exist = !!(result && result.from_address !== '0x0')
              return {
                initiator: exist ? result.initiator : undefined,
                poolOwner: exist ? await ownerOfPool(result.pool_index) : undefined,
                exist
              }
            } else if (prop === 'getLockedSwap') {
              const data = await memoizedGetResource(address, `${address}::MesonStates::GeneralStore`)
              const result = await readTable(data.locked_swaps.handle, {
                key_type: 'vector<u8>',
                value_type: `${address}::MesonStates::LockedSwap`,
                key: _getSwapId(Swap.decode(args[0]).encoded, args[1])
              })
              return {
                until: Number(result?.until || 0),
                poolOwner: result && await ownerOfPool(result.pool_index)
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
            }

            if (['depositAndRegister', 'deposit', 'withdraw'].includes(prop)) {
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toHexString()
              payload.type_arguments = [await getTokenAddr(tokenIndex)]
              payload.arguments = [BigNumber.from(args[0]).toHexString(), poolIndex]
            } else if (['addAuthorizedAddr', 'removeAuthorizedAddr'].includes(prop)) {
              payload.arguments = [args[0]]
            } else {
              const swap = Swap.decode(args[0])
              if (prop === 'postSwap') {
                const [_, r, s, v, postingValue] = args
                payload.type_arguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [
                  Array.from(utils.arrayify(swap.encoded)),
                  Array.from(_getCompactSignature(r, s, v)),
                  Array.from(utils.arrayify(postingValue.substring(0, 42))), // initiator
                  `0x${postingValue.substring(42)}` // pool_index
                ]
              } else if (prop === 'bondSwap') {
                payload.type_arguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [utils.arrayify(swap.encoded), args[1].toString()]
              } else if (prop === 'cancelSwap') {
                payload.type_arguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [utils.arrayify(swap.encoded)]
              } else if (prop === 'executeSwap') {
                const [_, r, s, v, recipient, depositToPool] = args
                payload.type_arguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [
                  utils.arrayify(swap.encoded),
                  _getCompactSignature(r, s, v),
                  utils.arrayify(recipient.substring(0, 42)),
                  depositToPool
                ]
              } else if (prop === 'lock') {
                const [_, r, s, v, { initiator, recipient }] = args
                payload.type_arguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  utils.arrayify(swap.encoded),
                  _getCompactSignature(r, s, v),
                  utils.arrayify(initiator),
                  recipient
                ]
              } else if (prop === 'unlock') {
                const [_, initiator] = args
                payload.type_arguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  utils.arrayify(swap.encoded),
                  utils.arrayify(initiator)
                ]
              } else if (prop === 'release') {
                const [_, r, s, v, initiator] = args
                payload.type_arguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  utils.arrayify(swap.encoded),
                  _getCompactSignature(r, s, v),
                  utils.arrayify(initiator)
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

function _getSwapId(encoded, initiator) {
  const packed = utils.solidityPack(['bytes32', 'address'], [encoded, initiator])
  return utils.keccak256(packed)
}

function _getCompactSignature(r, s, v) {
  if (v !== 27 && v !== 28) {
    throw new Error(`Invalid sig.v: ${v}`)
  }
  return utils.arrayify(r + s.replace(/0x\d/, x => (parseInt(x) + (v - 27) * 8).toString(16)))
}
