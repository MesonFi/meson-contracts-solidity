import { BigNumber, utils } from 'ethers'
import {
  stark,
  ec,
  CallData,
  Account as StarkAccount,
  Contract as StarkContract,
} from 'starknet'

import { getSwapId } from '../../utils'
import StarkAdaptor from './StarkAdaptor'
import StarkWallet, { StarkExtWallet } from './StarkWallet'
import AbiMeson from './abi/Meson.json'
import AbiERC20 from './abi/ERC20.json'

export function getWallet(seed: string, adaptor: StarkAdaptor, Wallet = StarkWallet): StarkWallet {
  let privateKey: string
  if (!seed) {
    privateKey = stark.randomAddress()
  } else {
    try {
      ec.starkCurve.getStarkKey(seed)
      privateKey = seed
    } catch {
      privateKey = `0x${ec.starkCurve.grindKey(seed)}`
    }
  }
  return new Wallet(adaptor, { privateKey })
}

export function getWalletFromExtension(ext, adaptor: StarkAdaptor): StarkExtWallet {
  return new StarkExtWallet(adaptor, ext)
}

const SELECTORS = {
  '0x004db261e4217fcc17865b5a1232b0056491ea745e507ae784ad2eb398c52254': 'postSwapFromInitiator',
  '0x0185e11faff2bbcd296a5ba35f551a0fdfc28ca64f48200080dc8fbe4367bb29': 'lockSwap',
  '0x015715de7ba72fb0a8c7becaaf930332748b50e8de16db7f48dda719bc4b8f89': 'executeSwap',
  '0x005a6dc6f7e8656767705fa1b809ec2c27086762f615cdddb3cd21888983b3e3': 'release',
  '0x032a1511efa26e7ac8cc6ed65fcdee1a0224012cfe96820e56d8030effe322f4': 'directRelease',
}

export function getContract(address: string, abi, adaptor: StarkAdaptor) {
  let signer: StarkAccount
  if (adaptor instanceof StarkWallet) {
    signer = adaptor.account
  }

  let starkContract: StarkContract
  if (abi.find(item => item.name === 'balanceOf')) {
    starkContract = new StarkContract(AbiERC20, address, signer || adaptor.client)
  } else {
    starkContract = new StarkContract(AbiMeson, address, signer || adaptor.client)
  }

  return new Proxy({}, {
    get(target, prop: string) {
      if (prop === 'address') {
        return address
      } else if (prop === 'provider') {
        return adaptor
      } else if (prop === 'signer') {
        if (adaptor instanceof StarkWallet) {
          return adaptor
        }
        throw new Error(`StarkContract doesn't have a signer.`)
      } else if (prop === 'interface') {
        return {
          format: () => abi,
          parseTransaction: ({ data, value }) => {
            const name = SELECTORS[data[0]?.selector]
            if (!name) {
              return
            }
            const abi2 = starkContract.abi.map(abi => ({ ...abi, outputs: abi.inputs }))
            const calldata = new CallData(abi2)
            const parsed: any = calldata.parse(name, data[0].data)
            const args: any = { encodedSwap: utils.hexZeroPad(parsed.encodedSwap, 32) }
            switch (name) {
              case 'postSwapFromInitiator':
                args.postingValue = BigNumber.from(parsed.postingValue)
                break
              case 'bondSwap':
              case 'cancelSwap':
                break
              case 'lockSwap':
                args.recipient = utils.hexZeroPad(parsed.recipient, 32)
              case 'unlock':
                args.initiator = utils.hexZeroPad(parsed.initiator, 20)
                break
              case 'executeSwap':
                args.recipient = utils.hexZeroPad(parsed.recipient, 20)
                args.r = utils.hexZeroPad(parsed.r, 32)
                args.yParityAndS = utils.hexZeroPad(parsed.yParityAndS, 32)
                break
              case 'directRelease':
                args.recipient = utils.hexZeroPad(parsed.recipient, 32)
              case 'release':
                args.initiator = utils.hexZeroPad(parsed.initiator, 20)
                args.r = utils.hexZeroPad(parsed.r, 32)
                args.yParityAndS = utils.hexZeroPad(parsed.yParityAndS, 32)
                break
            }
            return { name, args }
          }
        }
      } else if (['queryFilter', 'on', 'removeAllListeners'].includes(prop)) {
        return () => {}
      } else if (prop === 'connect') {
        return (wallet) => getContract(address, abi, wallet)
      } else if (prop === 'filters') {
        throw new Error('StarkContract.filters not implemented')
      } else if (prop === 'call') {
        // return call
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
            if (prop === 'getLockedSwap') {
              const initiator = args.pop()
              const encoded = args.pop()
              args.push(getSwapId(encoded, initiator))
            }

            const result = await starkContract[prop](...args)
            switch (prop) {
              case 'name':
              case 'symbol':
                return _bigintToString(result)
              case 'decimals':
                return Number(result)
              case 'balanceOf':
              case 'allowance':
                return BigNumber.from(result)
              case 'getShortCoinType':
                return _bigintToHex(result, 2)
              case 'getSupportedTokens':
                const tokens = result[0].map(formatAddress)
                const indexes = result[1].map(Number)
                return { tokens, indexes }
              case 'ownerOfPool':
                return formatAddress(result)
              case 'poolOfAuthorizedAddr':
                return Number(result)
              case 'poolTokenBalance':
              case 'serviceFeeCollected':
                return BigNumber.from(result)
              case 'getPostedSwap': {
                const exist = result[1] > 0n
                const pending = result[2] > 0n
                const initiator = _bigintToHex(result[1], 20)
                const fromAddress = formatAddress(result[2])
                return {
                  exist,
                  initiator: pending ? initiator : undefined,
                  poolOwner: pending ? formatAddress(await starkContract.ownerOfPool(result[0])) : undefined,
                  fromAddress,
                }
              }
              case 'getLockedSwap': {
                const until = Number(result[1])
                if (until) {
                  return { until, poolOwner: formatAddress(await starkContract.ownerOfPool(result[0])) }
                } else if (result[0] > 0n) {
                  return { until: 0, poolOwner: '0x1' } // released
                } else {
                  return { until: 0 } // unlocked or none
                }
              }
            }
            return result
          }
        } else {
          return async (...args) => {
            let options
            if (args.length > method.inputs.length) {
              options = args.pop()
            }
            if (prop === 'lockSwap') {
              const { initiator, recipient } = args.pop()
              args.push(initiator)
              args.push(recipient)
            } else if (prop === 'release') {
              args.pop()
            }
            const clonedArgs = args.map(arg => {
              if (arg._isBigNumber) {
                return arg.toBigInt()
              } else {
                return arg
              }
            })

            return await (adaptor as StarkWallet).sendTransaction({ instance: starkContract, method: prop, args: clonedArgs })
          }
        }
      }
      return target[prop]
    }
  })
}

function _bigintToString(num: bigint) {
  return utils.toUtf8String(utils.arrayify(`0x${num.toString(16)}`))
}

function _bigintToHex(num: bigint, length?: number) {
  const hex = `0x${num.toString(16)}`
  return length ? utils.hexZeroPad(hex, length) : hex
}

export function formatAddress(addr: string) {
  return utils.hexZeroPad(addr, 32)
}
