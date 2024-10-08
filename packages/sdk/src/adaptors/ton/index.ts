import { keyPairFromSecretKey } from '@ton/crypto'
import TonAdaptor from "./TonAdaptor";
import TonWallet, { TonExtWallet } from "./TonWallet";
import { BigNumber, BigNumberish } from 'ethers';
import { Swap } from '../../Swap';
import { beginCell, Address as TonAddress, toNano, TupleBuilder } from '@ton/core';
import { storeTokenTransfer } from './types';
import { parseEther } from 'ethers/lib/utils';
import { getSwapId } from '../../utils';

export function getWallet(privateKey: string, adaptor: TonAdaptor, Wallet = TonWallet): TonWallet {
  // Notice that TON_PRIVATE_KEY has 64 bytes
  // const derivedKey = privateKey.startsWith('0x') ?
  //   privateKey.substring(2) + privateKey.substring(2) : privateKey + privateKey
  privateKey = privateKey.replace(/^0x/, '')
  if (privateKey.length !== 128) {
    throw new Error('Invalid private key length')
  }
  const keypair = keyPairFromSecretKey(Buffer.from(privateKey, 'hex'))
  return new Wallet(adaptor, keypair)
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

  const _buildTransfer = async (tokenAddress: string, sender: string, recipient: string, value: BigNumberish, forwardTonAmount: string) => {
    let packedData = beginCell().store(storeTokenTransfer({
      $$type: "TokenTransfer",
      query_id: 0n,
      amount: BigNumber.from(value).toBigInt(),
      destination: TonAddress.parse(recipient),
      response_destination: TonAddress.parse(sender),
      custom_payload: beginCell().endCell(),
      forward_ton_amount: toNano(forwardTonAmount),
      forward_payload: beginCell().storeMaybeInt(null, 1).endCell(),
    })).endCell()
    const senderTokenWalletAddress = await _getTokenWalletAddress(TonAddress.parse(tokenAddress), TonAddress.parse(sender))

    return {
      to: senderTokenWalletAddress,
      value: toNano("0.1") + toNano(forwardTonAmount),      // For the whole token-transfer. Will be refunded if excess.
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
              return parseEther('1000000000')
            }

            // Meson
            if (prop === 'getShortCoinType') {
              // See https://github.com/satoshilabs/slips/blob/master/slip-0044.md?plain=1#L638
              return '0x025f'
            } else if (prop === 'getSupportedTokens') {
              return _getSupportedTokens()
            } else if (prop === 'poolTokenBalance') {
              // const balance = await adaptor.getBalance(address)
              // return balance.div(1000)  // decimals 9 -> 6
              throw new Error('TODO: poolTokenBalance not implemented')
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
              const outTokenAddress = await _getTokenAddress(swap.outToken)   // TODO: check this
              const txData = await _buildTransfer(outTokenAddress, adaptor.address, recipient, swap.amount, "0.001")
              return await adaptor.sendTransaction({ swapId, ...txData })
            } else if (prop === 'directExecuteSwap') {
              const inTokenAddress = await _getTokenAddress(swap.inToken)
              const txData = await _buildTransfer(inTokenAddress, adaptor.address, address, swap.amount, "0.001")
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
  return addr // TODO
}
