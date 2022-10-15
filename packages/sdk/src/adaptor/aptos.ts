import { BigNumber, utils } from 'ethers'
import { AptosClient, AptosAccount, CoinClient } from 'aptos'

import { Swap } from '../Swap'

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

export class AptosWallet {
  readonly client: AptosClient
  readonly signer: AptosAccount

  constructor(client: AptosClient, signer: AptosAccount) {
    this.client = client
    this.signer = signer
  }

  getAddress() {
    return this.signer.address()
  }

  async getBalance() {
    const coinClient = new CoinClient(this.client)
    return BigNumber.from(await coinClient.checkBalance(this.signer))
  }

  async sendTransaction(payload) {
    const tx = await this.client.generateTransaction(this.getAddress(), payload)
    const signed = await this.client.signTransaction(this.signer, tx)
    const pending = await this.client.submitTransaction(signed)

    return {
      hash: pending.hash,
      wait: async () => await this.client.waitForTransaction(pending.hash, { checkSuccess: true })
    }
  }
}

export function getWallet(privateKey, client: AptosClient): AptosWallet {
  const signer = new AptosAccount(utils.arrayify(privateKey))
  return new AptosWallet(client, signer)
}

export function getContract(address, abi, wallet: AptosWallet) {
  const { client, signer } = wallet
  return new Proxy({}, {
    get(target, prop: string) {
      if (prop === 'address') {
        return address
      } else if (prop === 'provider') {
        return client
      } else if (prop === 'signer') {
        return wallet
      } else if (prop === 'interface') {
        return new utils.Interface(abi)
      } else if (['queryFilter', 'on', 'removeAllListeners'].includes(prop)) {
        return () => {}
      } else if (prop === 'connect') {
        return (wallet: AptosWallet) => getContract(address, abi, wallet)
      } else if (prop === 'filters') {
        throw new Error('AptosContract.filters not implemented')
      }

      const method = abi.find(item => item.name === prop)
      if (method?.type === 'function') {
        if (['view', 'pure'].includes(method.stateMutability)) {
          return async (...args) => {
            let overrides
            if (args.length > method.inputs.length) {
              overrides = args.pop()
            }

            // TODO how to read from aptos contract?

            // ERC20 like
            if (prop === 'decimals') {
              return 6
            } else if (prop === 'allowance') {
              return BigNumber.from(10 ** 12)
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
            }

            throw new Error(`AptosContract read not implemented (${prop})`)
          }
        } else {
          return async (...args) => {
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

            if (prop === 'depositAndRegister') {
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
                  signer.address(), amount, expireTs, +swap.outChain, +swap.inChain,
                  utils.arrayify(utils.keccak256(swap.encoded))
                ]
              } else if (prop === 'lock') {
                payload.type_arguments = [_getTokenAddr(swap.outToken)]
                payload.arguments = [
                  '0x01015ace920c716794445979be68d402d28b2805b7beaae935d7fe369fa7cfa0', // recipient
                  amount, expireTs, +swap.outChain, +swap.inChain,
                  utils.arrayify(utils.keccak256(swap.encoded))
                ]
              } else if (prop === 'release') {
                payload.type_arguments = [_getTokenAddr(swap.outToken)]
                payload.arguments = [
                  utils.arrayify(swap.encoded),
                  amount, expireTs, +swap.outChain, +swap.inChain,
                  utils.arrayify(utils.keccak256(swap.encoded))
                ]
              } else if (prop === 'executeSwap') {
                payload.type_arguments = [_getTokenAddr(swap.inToken)]
                payload.arguments = [
                  utils.arrayify(swap.encoded),
                  amount, expireTs, +swap.outChain, +swap.inChain,
                  utils.arrayify(utils.keccak256(swap.encoded))
                ]
              }
            }

            return await wallet.sendTransaction(payload)
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
