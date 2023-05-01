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

export function getContract(address, abi, clientOrAdaptor: SuiProvider | SuiAdaptor, metadata) {
  let adaptor: SuiAdaptor
  if (clientOrAdaptor instanceof SuiWallet) {
    adaptor = clientOrAdaptor
  } else if (clientOrAdaptor instanceof SuiAdaptor) {
    adaptor = clientOrAdaptor
  } else {
    adaptor = new SuiAdaptor(clientOrAdaptor)
  }

  const getObject = async (objectId: string) => {
    try {
      const res = await adaptor.client.getObject({ id: objectId, options: { showContent: true } })
      return res.data?.content?.['fields'] as any
    } catch (e) {
      throw e
    }
  }
  const memoizedGetObject = memoize(getObject)

  const getDynamicFields = async (parentId: string) => {
    try {
      const res = await adaptor.client.getDynamicFields({ parentId })
      return res.data
    } catch (e) {
      throw e
    }
  }

  const getStoreG = memoize(() => memoizedGetObject(metadata.storeG))

  const getSupportedTokens = memoize(async () => {
    const storeG = await getStoreG()
    const data = await getDynamicFields(storeG.supported_coins.fields.id.id)
    const sortedData = data.sort((x, y) => x.name.value - y.name.value)
    const indexes: number[] = []
    const tokens: string[] = []
    for (const item of sortedData) {
      const coinObject = await memoizedGetObject(item.objectId)
      indexes.push(item.name.value)
      const [addr, mod, type] = coinObject.value.fields.name.split('::')
      tokens.push([utils.hexZeroPad(`0x${addr}`, 32), mod, type].join('::'))
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

  const getTokenIndex = async (tokenAddr: string) => {
    const { tokens, indexes } = await getSupportedTokens()
    const i = tokens.findIndex(addr => addr === tokenAddr)
    if (i === -1) {
      throw new Error(`Token addr ${tokenAddr} not found.`)
    }
    return indexes[i]
  }

  // TODO: What if owner of pool is transferred (although currently unsupported)?
  const ownerOfPool = memoize(async (poolIndex: BigNumberish) => {
    if (poolIndex.toString() === '0') {
      return
    }
    const storeG = await getStoreG()
    const data = await getDynamicFields(storeG.pool_owners.fields.id.id)
    const match = data.find(item => item.name.value === poolIndex.toString())
    if (!match) {
      return
    }
    return (await getObject(match.objectId)).value
  }, poolIndex => BigNumber.from(poolIndex).toString())

  const poolOfAuthorizedAddr = async (addr: string) => {
    const storeG = await getStoreG()
    const data = await getDynamicFields(storeG.pool_of_authorized_addr.fields.id.id)
    const match = data.find(item => item.name.value === addr)
    if (!match) {
      return 0
    }
    return Number((await getObject(match.objectId)).value)
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
        return (wallet: SuiWallet) => getContract(address, abi, wallet, metadata)
      } else if (prop === 'filters') {
        throw new Error('SuiContract.filters not implemented')
      } else if (prop === 'call') {
        return async (target, getArguments) => {
          const txBlock = new TransactionBlock()
          const { arguments: args = [], typeArguments = [] } = getArguments({ txBlock, metadata }) 
          const payload = { target, arguments: args, typeArguments }
          txBlock.moveCall(<any>payload)
          return await (<SuiWallet>adaptor).sendTransaction(txBlock)
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
              const tokenIndex = await getTokenIndex(token)
              const poolId = await poolOfAuthorizedAddr(poolOwner)

              // TODO: get storeC from contract calls
              const coinPoolObject = await memoizedGetObject(metadata.storeC[tokenIndex.toString()])
              const allCoins = await getDynamicFields(coinPoolObject.in_pool_coins.fields.id.id)
              const coinsInPool = allCoins.filter(item => item.name.value === poolId.toString())

              let balance = BigNumber.from(0)
              for (const coin of coinsInPool) {
                const coinObject = await getObject(coin.objectId)
                balance = balance.add(coinObject.value.fields.balance)
              }
              return balance
            } else if (prop === 'getPostedSwap') {
              const storeG = await getStoreG()
              const data = await getDynamicFields(storeG.posted_swaps.fields.id.id)
              const match = data.find(item => utils.hexlify(item.name.value) === args[0])
              if (!match) {
                return { exist: false }
              }
              const posted = (await getObject(match.objectId)).value.fields
              return {
                initiator: utils.hexlify(posted.initiator),
                poolOwner: await ownerOfPool(posted.pool_index),
                exist: true
              }
            } else if (prop === 'getLockedSwap') {
              const storeG = await getStoreG()
              const data = await getDynamicFields(storeG.locked_swaps.fields.id.id)
              const swapId = _getSwapId(Swap.decode(args[0]).encoded, args[1])
              const match = data.find(item => utils.hexlify(item.name.value) === swapId)
              if (!match) {
                return { until: 0 }
              }
              const locked = (await getObject(match.objectId)).value.fields
              return {
                until: Number(locked.until),
                poolOwner: await ownerOfPool(locked.pool_index)
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
              throw new Error('Not implemented')
            }

            if (prop === 'addSupportToken') {
              const [tokenAddr, tokenIndex] = args
              payload.typeArguments = [tokenAddr]
              payload.arguments = [
                tx.pure(metadata.adminCap),
                tx.pure(tokenIndex),
                tx.pure(metadata.storeG),
              ]
            } else if (['depositAndRegister', 'deposit'].includes(prop)) {
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toHexString()
              const tokenAddr = await getTokenAddr(tokenIndex)
              const coinList = await pickCoinObjects(tokenAddr, args[0])
              payload.typeArguments = [tokenAddr]
              payload.arguments = [
                tx.pure(BigNumber.from(args[0]).toHexString()),
                tx.pure(poolIndex),
                tx.makeMoveVec({ objects: coinList.map(obj => tx.object(obj.coinObjectId)) }),
                tx.object(metadata.storeG),
              ]
            } else if (prop === 'withdraw') {
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toHexString()
              const tokenAddr = await getTokenAddr(tokenIndex)
              payload.typeArguments = [tokenAddr]
              payload.arguments = [
                tx.pure(BigNumber.from(args[0]).toHexString()),
                tx.pure(poolIndex),
                tx.object(metadata.storeG),
              ]
            } else if (['addAuthorizedAddr', 'removeAuthorizedAddr', 'transferPoolOwner'].includes(prop)) {
              payload.arguments = [args[0]]
            } else {
              const swap = Swap.decode(args[0])
              if (prop === 'postSwap') {
                const [_, r, yParityAndS, postingValue] = args
                const tokenAddr = await getTokenAddr(swap.inToken)
                const coinList = await pickCoinObjects(tokenAddr, swap.amount)
                payload.typeArguments = [tokenAddr]
                payload.arguments = [
                  tx.pure(_vectorize(swap.encoded)),
                  tx.pure(_getCompactSignature(r, yParityAndS)),
                  tx.pure(_vectorize(postingValue.substring(0, 42))), // initiator
                  tx.pure(`0x${postingValue.substring(42)}`), // pool_index
                  tx.makeMoveVec({ objects: coinList.map(obj => tx.object(obj.coinObjectId)) }),
                  tx.object('0x6'),
                  tx.object(metadata.storeG),
                ]
              } else if (prop === 'bondSwap') {
                payload.typeArguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [
                  tx.pure(_vectorize(swap.encoded)),
                  tx.pure(args[1].toString()),
                  tx.object(metadata.storeG),
                ]
              } else if (prop === 'cancelSwap') {
                payload.typeArguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [
                  tx.pure(_vectorize(swap.encoded)),
                  tx.object(metadata.storeG),
                  tx.object('0x6'),
                ]
              } else if (prop === 'executeSwap') {
                const [_, r, yParityAndS, recipient, depositToPool] = args
                payload.typeArguments = [await getTokenAddr(swap.inToken)]
                payload.arguments = [
                  tx.pure(_vectorize(swap.encoded)),
                  tx.pure(_getCompactSignature(r, yParityAndS)),
                  tx.pure(_vectorize(recipient.substring(0, 42))),
                  tx.pure(depositToPool),
                  tx.object(metadata.storeG),
                  tx.object('0x6'),
                ]
              } else if (prop === 'lock') {
                const [_, r, yParityAndS, { initiator, recipient }] = args
                payload.typeArguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  tx.pure(_vectorize(swap.encoded)),
                  tx.pure(_getCompactSignature(r, yParityAndS)),
                  tx.pure(_vectorize(initiator)),
                  tx.pure(recipient),
                  tx.object(metadata.storeG),
                  tx.object('0x6'),
                ]
              } else if (prop === 'unlock') {
                const [_, initiator] = args
                payload.typeArguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  tx.pure(_vectorize(swap.encoded)),
                  tx.pure(_vectorize(initiator)),
                  tx.object(metadata.storeG),
                  tx.object('0x6'),
                ]
              } else if (prop === 'release') {
                const [_, r, yParityAndS, initiator] = args
                payload.typeArguments = [await getTokenAddr(swap.outToken)]
                payload.arguments = [
                  tx.pure(_vectorize(swap.encoded)),
                  tx.pure(_getCompactSignature(r, yParityAndS)),
                  tx.pure(_vectorize(initiator)),
                  tx.object(metadata.storeG),
                  tx.object('0x6'),
                ]
              }
            }

            tx.moveCall(<any>payload)
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
    MesonStates: ['addSupportToken'],
    MesonPools: [
      'depositAndRegister',
      'deposit',
      'withdraw',
      'addAuthorizedAddr',
      'removeAuthorizedAddr',
      'transferPoolOwner',
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
