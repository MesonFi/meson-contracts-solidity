import { BigNumber, BigNumberish } from 'ethers'
import { keyPairFromSeed, keyPairFromSecretKey } from '@ton/crypto'
import { beginCell, Address as TonAddress, toNano, TupleBuilder } from '@ton/core'

import TonAdaptor from './TonAdaptor'
import TonWallet, { TonExtWallet } from './TonWallet'
import { Swap } from '../../Swap'
import { storeTokenTransfer } from './types'
import { getSwapId } from '../../utils'

export function getWallet(_key: string = '', adaptor: TonAdaptor, Wallet = TonWallet): TonWallet {
  if (!_key) {
    throw new Error('No private key given')
  }
  
  const key = _key.replace(/^0x/, '')
  if (key.length === 64) {
    return new Wallet(adaptor, keyPairFromSeed(Buffer.from(key, 'hex')))
  } else if (key.length === 128) {
    return new Wallet(adaptor, keyPairFromSecretKey(Buffer.from(key, 'hex')))
  }
}

export function getWalletFromExtension(ext, adaptor: TonAdaptor): TonExtWallet {
  return new TonExtWallet(adaptor, ext)
}

export function getContract(address: string, abi, adaptor: TonAdaptor) {
  const metadata = (<any>adaptor.client).metadata || {}

  const _getSupportedTokens = () => {
    const tokens = metadata.tokens || []
    return { tokens: tokens.map(t => t.addr), indexes: tokens.map(t => t.tokenIndex) }
  }

  const _getTokenAddress = (tokenIndex: number) => {
    const { tokens, indexes } = _getSupportedTokens()
    const i = indexes.findIndex(i => i === tokenIndex)
    if (i === -1) {
      throw new Error(`Token index ${tokenIndex} not found.`)
    }
    return tokens[i]
  }

  const _getTokenWalletAddress = async (tokenAddress: TonAddress, userAddress: TonAddress) => {
    let builder = new TupleBuilder()
    builder.writeAddress(userAddress)
    return (await adaptor.client.runMethod(
      tokenAddress, 'get_wallet_address', builder.build(),
    )).stack.readAddress()
  }

  const _getBalanceOf = async (tokenAddress: TonAddress, userAddress: TonAddress) => {
    const userWalletData = (await adaptor.client.runMethod(
      await _getTokenWalletAddress(tokenAddress, userAddress), 'get_wallet_data'
    )).stack
    return userWalletData.readBigNumber()
  }

  const _buildTransfer = async (tokenAddress: string, sender: string, recipient: string, value: BigNumberish) => {
    let packedData = beginCell().store(storeTokenTransfer({
      $$type: 'TokenTransfer',
      query_id: 0n,
      amount: BigNumber.from(value).toBigInt(),
      destination: TonAddress.parse(recipient),
      response_destination: TonAddress.parse(sender),
      custom_payload: beginCell().endCell(),
      forward_ton_amount: 1n,
      forward_payload: beginCell().storeMaybeInt(null, 1).endCell(),
    })).endCell()
    const senderTokenWalletAddress = await _getTokenWalletAddress(TonAddress.parse(tokenAddress), TonAddress.parse(sender))

    return {
      to: senderTokenWalletAddress,
      value: toNano('0.05'),
      body: packedData,
    }
  }

  return new Proxy({}, {
    get(target, prop: string) {
      if (prop === 'address') {
        return address
      } else if (prop === 'provider') {
        return adaptor
      } else if (prop === 'signer') {
        if (adaptor instanceof TonWallet) {
          return adaptor
        } else {
          throw new Error(`TonContract doesn't have a signer.`)
        }
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
        return (wallet: TonWallet) => getContract(address, abi, wallet)
      } else if (prop === 'filters') {
        throw new Error('TonContract.filters not implemented')
      } else if (prop === 'pendingTokenBalance') {
        return async (tokenIndex: number) => {
        }
      }

      let method = abi.find(item => item.name === prop)
      if (method?.type === 'function') {

        if (['view', 'pure'].includes(method.stateMutability)) {
          return async (...args) => {
            // ERC20 like
            if (prop === 'name') {
              return metadata.tokens.filter(t => t.addr === address)[0]?.name || ''
            } else if (prop === 'symbol') {
              return metadata.tokens.filter(t => t.addr === address)[0]?.symbol || ''
            } else if (prop === 'decimals') {
              return metadata.tokens.filter(t => t.addr === address)[0]?.decimals || 6
            } else if (prop === 'balanceOf') {
              return await _getBalanceOf(TonAddress.parse(address), TonAddress.parse(args[0]))
            } else if (prop === 'allowance') {
              return BigNumber.from(2).pow(128).sub(1)
            }

            // Meson
            if (prop === 'getShortCoinType') {
              return '0x025f'
            } else if (prop === 'getSupportedTokens') {
              return _getSupportedTokens()
            } else if (prop === 'poolTokenBalance') {
              const balance = await _getBalanceOf(TonAddress.parse(args[0]), TonAddress.parse(address))
              return balance
            } else if (prop === 'serviceFeeCollected') {
              return BigNumber.from(0)
            }
          }
        } else {
          return async (...args) => {
            if (!(adaptor instanceof TonWallet)) {
              throw new Error(`TonContract doesn't have a signer.`)
            }

            let options
            if (args.length > method.inputs.length) {
              options = args.pop()
            }

            const swap = Swap.decode(args[0])
            if (prop === 'directRelease') {
              const [_encoded, _r, _yParityAndS, _initiator, recipient] = args
              const swapId = getSwapId(_encoded, _initiator)
              const outTokenAddress = await _getTokenAddress(swap.outToken)
              const txData = await _buildTransfer(outTokenAddress, adaptor.address, recipient, swap.receive)
              return await adaptor.sendTransaction({ swapId, ...txData })
            } else if (prop === 'directExecuteSwap') {
              const inTokenAddress = await _getTokenAddress(swap.inToken)
              const txData = await _buildTransfer(inTokenAddress, adaptor.address, address, swap.amount)
              return await adaptor.sendTransaction(txData)
            } else {
              throw new Error(`Method ${prop} is not implemented.`)
            }
          }
        }
      }

    }
  })
}

export function formatAddress(addr: string) {
  try {
    return TonAddress.parseFriendly(addr).address.toString({ bounceable: false })
  } catch {
    return
  }
}
