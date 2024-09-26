import { BigNumber, BigNumberish, utils } from 'ethers'
import { Ed25519Keypair as SuiKeypair } from '@mysten/sui.js/keypairs/ed25519'
import { TransactionBlock } from '@mysten/sui.js/transactions'

import memoize from 'lodash/memoize'

import { getSwapId } from '../../utils'
import { Swap } from '../../Swap'
import SuiAdaptor from './SuiAdaptor'
import SuiWallet, { SuiExtWallet } from './SuiWallet'

export function getWallet(privateKey: string, adaptor: SuiAdaptor, Wallet = SuiWallet): SuiWallet {
  let keypair: SuiKeypair
  if (!privateKey) {
    keypair = SuiKeypair.generate()
  } else if (privateKey.startsWith('0x')) {
    keypair = SuiKeypair.fromSecretKey(utils.arrayify(privateKey))
  } else { // mnemonics
    keypair = SuiKeypair.deriveKeypair(privateKey)
  }
  return new Wallet(adaptor, keypair)
}

export function getWalletFromExtension(ext, adaptor: SuiAdaptor): SuiExtWallet {
  return new SuiExtWallet(adaptor, ext)
}

export function getContract(address: string, abi, adaptor: SuiAdaptor) {
  const getMetadata = memoize(async () => {
    const obj = await adaptor.client.getObject({ id: address, options: { showPreviousTransaction: true } })
    const result = await adaptor.client.getTransactionBlock({ digest: obj.data.previousTransaction, options: { showEffects: true } })
    const ownedObjects = await Promise.all(
      result.effects.created.filter(obj => !!obj.owner['AddressOwner']).map(obj => getObject(obj.reference.objectId))
    )
    return {
      storeG: result.effects.created.find(obj => !!obj.owner['Shared']).reference.objectId,
      adminCap: ownedObjects.find(obj => !obj.total_supply && !obj.package).id.id,
    }
  })

  const getObject = async (objectId: string) => {
    try {
      const res = await adaptor.client.getObject({ id: objectId, options: { showContent: true } })
      return (<any>res.data.content).fields
    } catch (e) {
      throw e
    }
  }
  const memoizedGetObject = memoize(getObject)
  const getStoreG = memoize(async () => memoizedGetObject((await getMetadata()).storeG))

  const getDynamicFields = async (store: any) => {
    try {
      const res = await adaptor.client.getDynamicFields({ parentId: store.fields.id.id })
      return res.data
    } catch (e) {
      throw e
    }
  }

  const getDynamicFieldValue = async (store: any, field: { type: string, value: any }) => {
    try {
      const res = await adaptor.client.getDynamicFieldObject({ parentId: store.fields.id.id, name: field })
      if (res.error?.code === 'dynamicFieldNotFound') {
        return
      }
      return (<any>res?.data.content).fields.value
    } catch (e) {
      if (e.errors) {
        e = e.errors[0]
      }
      if (e.cause.message?.includes('Cannot find dynamic field')) {
        return
      }
      throw e
    }
  }

  const getSupportedTokens = memoize(async () => {
    const storeG = await getStoreG()
    const data = await getDynamicFields(storeG.supported_coins)
    const sortedData = data.sort((x, y) => Number(x.name.value) - Number(y.name.value))
    const indexes: number[] = []
    const tokens: string[] = []
    for (const item of sortedData) {
      const coinObject = await memoizedGetObject(item.objectId)
      indexes.push(Number(item.name.value))
      tokens.push(formatAddress(coinObject.value.fields.name))
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
  const ownerOfPool = memoize(async (poolIndex: BigNumberish) => {
    if (poolIndex.toString() === '0') {
      return
    }
    const storeG = await getStoreG()
    const ownerAddr = await getDynamicFieldValue(storeG.pool_owners, { type: 'u64', value: poolIndex.toString() })
    if (!ownerAddr) {
      return
    }
    return utils.hexZeroPad(ownerAddr, 32)
  }, poolIndex => BigNumber.from(poolIndex).toString())

  const poolOfAuthorizedAddr = async (addr: string) => {
    const storeG = await getStoreG()
    const poolIndex = await getDynamicFieldValue(storeG.pool_of_authorized_addr, { type: 'address', value: addr })
    if (!poolIndex) {
      return 0
    }
    return Number(poolIndex)
  }

  const pickCoinObjects = async (tokenAddr: string, amount: BigNumberish) => {
    const signer = (<SuiWallet>adaptor).address
    const coins = await adaptor.client.getCoins({
      owner: signer,
      coinType: tokenAddr,
    })
    const bnAmount = BigNumber.from(amount)
    const enoughCoins = coins.data.find(obj => bnAmount.lte(obj.balance))
    if (enoughCoins) {
      return [enoughCoins]
    }

    const pickedCoins = []
    let mergedAmount = BigNumber.from(0)
    for (const obj of coins.data) {
      pickedCoins.push(obj)
      mergedAmount = mergedAmount.add(obj.balance)
      if (mergedAmount.gte(bnAmount)) {
        return pickedCoins
      }
    }
    throw new Error(`Insufficient balance: ${tokenAddr}.`)
  }

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
              case 'postSwapFromInitiator':
                args.postingValue = BigNumber.from(utils.solidityPack(['address', 'uint40'], [rawArgs[1], rawArgs[2]]))
                break
              case 'bondSwap':
              case 'cancelSwap':
                break
              case 'lockSwap':
              case 'unlock':
                args.initiator = rawArgs[1]
                break
              case 'executeSwap':
                args.recipient = rawArgs[2]
                break
              case 'release':
                args.initiator = rawArgs[2]
                break
              case 'directRelease':
                args.initiator = rawArgs[2]
                args.recipient = rawArgs[3]
                break
            }
            if (['executeSwap', 'release', 'directRelease'].includes(name)) {
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
      } else if (prop === 'call') {
        return async (target, getArguments) => {
          const txb = new TransactionBlock()
          let metadata
          if (target.includes('::Meson')) {
            metadata = await getMetadata()
          }
          const { arguments: args = [], typeArguments = [] } = getArguments(txb, metadata)
          const payload = { target, arguments: args, typeArguments }
          txb.moveCall(<any>payload)
          return await (<SuiWallet>adaptor).sendTransaction(txb)
        }
      } else if (prop === 'pendingTokenBalance') {
        return async tokenIndex => {
          const tokenAddr = await getTokenAddr(tokenIndex)
          const storeG = await getStoreG()
          const pendingCoins = await getDynamicFieldValue(storeG.pending_coins, { type: '0x1::type_name::TypeName', value: tokenAddr.replace('0x', '') })
          if (!pendingCoins) {
            return BigNumber.from(0)
          }
          const coins = await getDynamicFields(pendingCoins)
          const balances = await Promise.all(coins.map(coin => getObject(coin.objectId)))
          return balances.reduce((prev, obj) => prev.add(obj.value.fields.balance), BigNumber.from(0))
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
              const data = await adaptor.client.getCoinMetadata({ coinType: address })
              return data.name
            } else if (prop === 'symbol') {
              const data = await adaptor.client.getCoinMetadata({ coinType: address })
              return data.symbol
            } else if (prop === 'decimals') {
              const data = await adaptor.client.getCoinMetadata({ coinType: address })
              return data.decimals
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
              const poolIndex = await poolOfAuthorizedAddr(poolOwner)
              if (!poolIndex) {
                return BigNumber.from(0)
              }
              const storeG = await getStoreG()
              const poolsForCoin = await getDynamicFieldValue(storeG.in_pool_coins, { type: '0x1::type_name::TypeName', value: token.replace('0x', '') })
              if (!poolsForCoin) {
                return BigNumber.from(0)
              }
              const poolCoins = await getDynamicFieldValue(poolsForCoin, { type: 'u64', value: poolIndex.toString() })
              if (!poolCoins) {
                return BigNumber.from(0)
              }
              return BigNumber.from(poolCoins.fields.balance)
            } else if (prop === 'serviceFeeCollected') {
              const [tokenIndex] = args
              const tokenAddr = await getTokenAddr(tokenIndex)
              const storeG = await getStoreG()
              const poolsForCoin = await getDynamicFieldValue(storeG.in_pool_coins, { type: '0x1::type_name::TypeName', value: tokenAddr.replace('0x', '') })
              if (!poolsForCoin) {
                return BigNumber.from(0)
              }
              const poolCoins = await getDynamicFieldValue(poolsForCoin, { type: 'u64', value: '0' })
              if (!poolCoins) {
                return BigNumber.from(0)
              }
              return BigNumber.from(poolCoins.fields.balance)
            } else if (prop === 'getPostedSwap') {
              const storeG = await getStoreG()
              const swap = Swap.decode(args[0])
              const result = await getDynamicFieldValue(storeG.posted_swaps, { type: 'vector<u8>', value: _vectorize(swap.encoded + 'ff') })
              if (!result) {
                return { exist: false }
              }
              const pending = BigNumber.from(result.fields.from_address).gt(0)
              return {
                initiator: pending ? utils.hexlify(result.fields.initiator) : undefined,
                poolOwner: pending ? await ownerOfPool(result.fields.pool_index) : undefined,
                exist: true
              }
            } else if (prop === 'getLockedSwap') {
              const storeG = await getStoreG()
              const swap = Swap.decode(args[0])
              const swapId = getSwapId(swap.encoded, args[1])
              const result = await getDynamicFieldValue(storeG.locked_swaps, { type: 'vector<u8>', value: _vectorize(swapId) })
              if (!result) {
                return { until: 0 } // never locked
              } else if (!Number(result.fields.until)) {
                return { until: 0, poolOwner: '0x1' } // locked & released
              }
              return {
                until: Number(result.fields.until),
                poolOwner: await ownerOfPool(result.fields.pool_index)
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

            const txb = new TransactionBlock()
            const module = _findMesonMethodModule(prop)
            const payload = {
              target: `${address}::${module}::${prop}`,
              arguments: undefined,
              typeArguments: undefined,
            }

            let metadata
            if (prop !== 'transfer') {
              metadata = await getMetadata()
            }

            if (prop === 'transfer') {
              const [to, value] = args
              const coins = await pickCoinObjects(address, value)
              if (coins.length > 1) {
                throw new Error('Need to merge coins.')
              }
              const [coin] = txb.splitCoins(txb.object(coins[0].coinObjectId), [txb.pure(value)])
              txb.transferObjects([coin], txb.pure(to))
            } else if (prop === 'addSupportToken') {
              const [tokenAddr, tokenIndex] = args
              payload.typeArguments = [tokenAddr]
              payload.arguments = [
                txb.pure(metadata.adminCap),
                txb.pure(tokenIndex),
                txb.pure(metadata.storeG),
              ]
            } else if (['depositAndRegister', 'deposit'].includes(prop)) {
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toHexString()
              const tokenAddr = await getTokenAddr(tokenIndex)
              const coinList = await pickCoinObjects(tokenAddr, args[0])
              payload.typeArguments = [tokenAddr]
              payload.arguments = [
                txb.pure(BigNumber.from(args[0]).toHexString()),
                txb.pure(poolIndex),
                txb.makeMoveVec({ objects: coinList.map(obj => txb.object(obj.coinObjectId)) }),
                txb.object(metadata.storeG),
              ]
            } else if (prop === 'withdraw') {
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toHexString()
              const tokenAddr = await getTokenAddr(tokenIndex)
              payload.typeArguments = [tokenAddr]
              payload.arguments = [
                txb.pure(BigNumber.from(args[0]).toHexString()),
                txb.pure(poolIndex),
                txb.object(metadata.storeG),
              ]
            } else if (['addAuthorizedAddr', 'removeAuthorizedAddr', 'transferPoolOwner'].includes(prop)) {
              payload.arguments = [txb.object(args[0]), txb.object(metadata.storeG)]
            } else if (prop === 'withdrawServiceFee') {
              const [tokenIndex, amount, toPoolIndex] = args
              payload.typeArguments = [await getTokenAddr(tokenIndex)]
              payload.arguments = [
                txb.pure(metadata.adminCap),
                txb.pure(BigNumber.from(amount).toHexString()),
                txb.pure(toPoolIndex),
                txb.object(metadata.storeG),
              ]
            } else {
              const swap = Swap.decode(args[0])
              if (prop === 'postSwapFromInitiator') {
                const [_, postingValue] = args
                const tokenAddr = await getTokenAddr(swap.inToken)
                const coinList = await pickCoinObjects(tokenAddr, swap.amount)
                payload.typeArguments = [tokenAddr]
                payload.arguments = [
                  txb.pure(_vectorize(swap.encoded)),
                  txb.pure(_vectorize(postingValue.substring(0, 42))), // initiator
                  txb.pure(`0x${postingValue.substring(42)}`), // pool_index
                  txb.makeMoveVec({ objects: coinList.map(obj => txb.object(obj.coinObjectId)) }),
                  txb.object('0x6'),
                  txb.object(metadata.storeG),
                ]
              } else if (prop === 'bondSwap') {
                payload.typeArguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [
                  txb.pure(_vectorize(swap.encoded)),
                  txb.pure(args[1].toString()),
                  txb.object(metadata.storeG),
                ]
              } else if (prop === 'cancelSwap') {
                payload.typeArguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [
                  txb.pure(_vectorize(swap.encoded)),
                  txb.object(metadata.storeG),
                  txb.object('0x6'),
                ]
              } else if (prop === 'executeSwap') {
                const [_, r, yParityAndS, recipient, depositToPool] = args
                payload.typeArguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [
                  txb.pure(_vectorize(swap.encoded)),
                  txb.pure(_getCompactSignature(r, yParityAndS)),
                  txb.pure(_vectorize(recipient.substring(0, 42))),
                  txb.pure(depositToPool),
                  txb.object(metadata.storeG),
                  txb.object('0x6'),
                ]
              } else if (prop === 'lockSwap') {
                const [_, { initiator, recipient }] = args
                payload.typeArguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  txb.pure(_vectorize(swap.encoded)),
                  txb.pure(_vectorize(initiator)),
                  txb.pure(recipient),
                  txb.object(metadata.storeG),
                  txb.object('0x6'),
                ]
              } else if (prop === 'unlock') {
                const [_, initiator] = args
                payload.typeArguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  txb.pure(_vectorize(swap.encoded)),
                  txb.pure(_vectorize(initiator)),
                  txb.object(metadata.storeG),
                  txb.object('0x6'),
                ]
              } else if (prop === 'release') {
                const [_, r, yParityAndS, initiator] = args
                payload.typeArguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  txb.pure(_vectorize(swap.encoded)),
                  txb.pure(_getCompactSignature(r, yParityAndS)),
                  txb.pure(_vectorize(initiator)),
                  txb.object(metadata.storeG),
                  txb.object('0x6'),
                ]
              } else if (prop === 'directRelease') {
                const [_, r, yParityAndS, initiator, recipient] = args
                payload.typeArguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  txb.pure(_vectorize(swap.encoded)),
                  txb.pure(_getCompactSignature(r, yParityAndS)),
                  txb.pure(_vectorize(initiator)),
                  txb.pure(recipient),
                  txb.object(metadata.storeG),
                  txb.object('0x6'),
                ]
              } else if (prop === 'simpleRelease') {
                const [_, recipient] = args
                payload.typeArguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  txb.pure(_vectorize(swap.encoded)),
                  txb.pure(recipient),
                  txb.object(metadata.storeG),
                ]
              }
            }

            if (payload.arguments) {
              txb.moveCall(<any>payload)
            }
            return await (<SuiWallet>adaptor).sendTransaction(txb, options)
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
      'simpleRelease',
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
