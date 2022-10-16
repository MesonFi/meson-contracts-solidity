import { BigNumber, utils } from 'ethers'
import { AptosClient, AptosAccount, BCS } from 'aptos'

import { AptosWallet, AptosProvider } from './classes'
import { Swap } from '../../Swap'

const tokens = [
  {
    addr: '0x01015ace920c716794445979be68d402d28b2805b7beaae935d7fe369fa7cfa0::aUSDC::TypeUSDC',
    tokenIndex: 1,
  },
  {
    addr: '0xaaefd8848cb707617bf82894e2d7af6214b3f3a8e3fc32e91bc026f05f5b10bb::aUSDT::TypeUSDT',
    tokenIndex: 2,
  }
]

export function getWallet(privateKey, client: AptosClient): AptosWallet {
  const signer = new AptosAccount(privateKey && utils.arrayify(privateKey))
  return new AptosWallet(client, signer)
}

export function getContract(address, abi, walletOrClient: AptosProvider | AptosClient) {
  let provider: AptosProvider
  let signer: AptosAccount

  if (walletOrClient instanceof AptosWallet) {
    provider = walletOrClient
    signer = walletOrClient.signer
  } else if (walletOrClient instanceof AptosProvider) {
    provider = walletOrClient
  } else {
    provider = new AptosProvider(walletOrClient)
  }
  return new Proxy({}, {
    get(target, prop: string) {
      if (prop === 'address') {
        return address
      } else if (prop === 'provider') {
        return provider
      } else if (prop === 'signer') {
        return provider
      } else if (prop === 'interface') {
        return {
          format: () => abi,
          encodeFunctionData: () => { throw new Error('Not implemented: encodeFunctionData') },
          parseTransaction: tx => {
            const payload = JSON.parse(tx.data)
            if (payload.type !== 'entry_function_payload') {
              throw new Error(`Payload type ${payload.type} unsupported`)
            }
            const { function: fun, type_arguments, arguments: args } = payload
            const [addr, module, name] = fun.split('::')
            const encoded0 = utils.hexZeroPad(BigNumber.from(args[0][0]).toHexString(), 16)
            const encoded1 = utils.hexZeroPad(BigNumber.from(args[0][1]).toHexString(), 16)
            const encodedSwap = encoded0 + encoded1.substring(2)
            return {
              name,
              args: { encodedSwap, initiator: args[1] }
            }
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
      if (prop === 'initializeTable') {
        method = { type: 'function', inputs: [{}, {}] }
      }
      if (method?.type === 'function') {
        if (['view', 'pure'].includes(method.stateMutability)) {
          return async (...args) => {
            let overrides
            if (args.length > method.inputs.length) {
              overrides = args.pop()
            }

            // TODO how to read from aptos contract?

            // ERC20 like
            if (['name', 'symbol', 'decimals'].includes(prop)) {
              const account = address.split('::')[0]
              const result = await provider.client.getAccountResource(account, `0x1::coin::CoinInfo<${address}>`)
              return (result.data as any)[prop]
            } else if (prop === 'balanceOf' || prop === 'allowance') {
              try {
                const result = await provider.client.getAccountResource(args[0], `0x1::coin::CoinStore<${address}>`)
                return BigNumber.from((result.data as any).coin.value)
              } catch (e) {
                if (e.errorCode === 'resource_not_found') {
                  return BigNumber.from(0)
                }
                throw e
              }
            }
            
            // Meson
            if (prop === 'getShortCoinType') {
              return '0x027d'
            } else if (prop === 'getSupportedTokens') {
              return {
                tokens: tokens.map(t => t.addr),
                indexes: tokens.map(t => t.tokenIndex)
              }
            } else if (prop === 'poolOfAuthorizedAddr') {
              return 1
            } else if (prop === 'poolTokenBalance') {
              const [token, poolOwner] = args
              try {
                const result = await provider.client.getAccountResource(poolOwner, `${address}::MesonStates::StakingCoin<${token}>`)
                return BigNumber.from((result.data as any).value)
              } catch (e) {
                if (e.errorCode === 'resource_not_found') {
                  return BigNumber.from(0)
                }
                throw e
              }
            } else if (prop === 'getLockedSwap') {
              const swap = Swap.decode(args[0])
              const result = await provider.client.getAccountResource(address, `${address}::MesonPools::StoredContentOfPools<${tokens[0].addr}>`)
              const handle = (result.data as any)._lockedSwaps.handle

              try {
               const result =  await provider.client.getTableItem(handle, {
                  key_type: 'vector<u8>',
                  value_type: `${address}::MesonPools::LockedSwap`,
                  key: swap.encoded // should be swapId
                })
                return {
                  until: Number(result.until),
                  poolOwner: result.poolOwner
                }
              } catch (e) {
                if (e.errorCode === 'table_item_not_found') {
                  return { until: 0 }
                }
                throw e
              }
            }

            throw new Error(`AptosContract read not implemented (${prop})`)
          }
        } else {
          return async (...args) => {
            if (!signer) {
              throw new Error('No signer given')
            }

            let overrides
            if (args.length > method.inputs.length) {
              overrides = args.pop()
            }

            const module = _findMesonMethodModule(prop)
            const payload = {
              function: `${address}::${module}::${prop}`,
              type_arguments: [],
              arguments: []
            }

            if (prop === 'initializeTable') {
              const [module, tokenIndex] = args
              payload.function = `${address}::${module}::${prop}`
              payload.type_arguments = [_getTokenAddr(tokenIndex)]
            } else if (prop === 'depositAndRegister') {
              const [amount, poolTokenIndex] = args
              const tokenIndex = BigNumber.from(poolTokenIndex).div(2**40).toNumber()
              payload.type_arguments = [_getTokenAddr(tokenIndex)]
              payload.arguments = [amount.toBigInt()] // TODO: amount is BigNumberish
            } else if (prop === 'deposit') {
              const [amount, poolTokenIndex] = args
              const tokenIndex = BigNumber.from(poolTokenIndex).div(2**40).toNumber()
              payload.type_arguments = [_getTokenAddr(tokenIndex)]
              payload.arguments = [amount.toBigInt()] // TODO: amount is BigNumberish
            } else {
              const swap = Swap.decode(args[0])
              const amount = swap.amount.toBigInt()
              const expireTs = swap.expireTs
  
              if (prop === 'postSwap') {
              payload.type_arguments = [_getTokenAddr(swap.inToken)]
                payload.arguments = [
                  [swap.encoded.substring(0, 34), '0x' + swap.encoded.substring(34)],
                  signer.address(),
                  utils.arrayify(utils.keccak256(swap.encoded))
                ]
              } else if (prop === 'lock') {
                // signedRequest.encoded, ...signedRequest.signature, signedRequest.initiator
                payload.type_arguments = [_getTokenAddr(swap.outToken)]
                payload.arguments = [
                  [swap.encoded.substring(0, 34), '0x' + swap.encoded.substring(34)],
                  utils.arrayify(args[4]),
                  signer.address().toString(), // should change to recipient address
                  utils.arrayify(utils.keccak256(swap.encoded))
                ]
              } else if (prop === 'release') {
                payload.type_arguments = [_getTokenAddr(swap.outToken)]
                payload.arguments = [
                  [swap.encoded.substring(0, 34), '0x' + swap.encoded.substring(34)],
                  utils.arrayify(args[4]),
                  utils.arrayify(swap.encoded),
                  utils.arrayify(utils.keccak256(swap.encoded))
                ]
                console.log(signer.address())
              } else if (prop === 'executeSwap') {
                payload.type_arguments = [_getTokenAddr(swap.inToken)]
                payload.arguments = [
                  [swap.encoded.substring(0, 34), '0x' + swap.encoded.substring(34)],
                  [], // initiator
                  signer.address(), // should change to recipient address
                  utils.arrayify(swap.encoded),
                  utils.arrayify(utils.keccak256(swap.encoded)),
                  false
                ]
              }
            }

            return await (provider as AptosWallet).sendTransaction(payload)
          }
        }
      }
      return target[prop]
    }
  })
}

function _findMesonMethodModule (method) {
  const moduleMethods = {
    MesonPools: ['depositAndRegister', 'deposit', 'lock', 'release'],
    MesonSwap: ['postSwap', 'executeSwap'],
  }

  for (const module of Object.keys(moduleMethods)) {
    if (moduleMethods[module].includes(method)) {
      return module
    }
  }
}

function _getTokenAddr (tokenIndex) {
  const token = tokens.find(t => t.tokenIndex === tokenIndex)
  return token?.addr
}
