import { keyPairFromSecretKey } from '@ton/crypto'
import TonAdaptor from "./TonAdaptor";
import TonWallet from "./TonWallet";
import { BigNumber } from 'ethers';
import { Swap } from '../../Swap';
import { beginCell, Dictionary, Address as TonAddress, toNano, TupleBuilder } from '@ton/core';
import { memoize } from 'lodash';
import { storeModifySupportToken, storeTokenTransfer } from './types';

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

export function getContract(address: string, abi, adaptor: TonAdaptor) {
  const tokens = (<any>adaptor.client).tokens || {}

  const _getSupportedTokens = memoize(async () => {
    const supportedTokensResultStack = (await adaptor.client.runMethod(TonAddress.parse(address), 'token_for_index_map')).stack
    const supportedTokensDict = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), supportedTokensResultStack.readCell())
    const indexes: number[] = []
    const tokens: string[] = []
    for (let i = 1n; i < 255n; i++) {
      const tokenAddr = supportedTokensDict.get(i)
      if (tokenAddr != undefined) {
        indexes.push(Number(i))
        tokens.push(tokenAddr.toString())
      }
    }
    return { tokens, indexes }
  })


  // const _getSupportedTokens = async () => {
  //   return { tokens: tokens.map(t => t.addr), indexes: tokens.map(t => t.tokenIndex) }
  // }

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
              return 'Mock Ton USD Circle'
            } else if (prop === 'symbol') {
              return 'USDC'
            } else if (prop === 'decimals') {
              return 9
            } else if (prop === 'balanceOf') {
              return await _getBalanceOf(TonAddress.parse(address), TonAddress.parse(args[0]))
            } else if (prop === 'allowance') {
              return BigNumber.from(0)
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

            if (prop === 'transfer') {
              const [recipient, value] = args
              const emptyCell = beginCell().endCell()

              let packedData = beginCell().store(
                  storeTokenTransfer({
                    $$type: "TokenTransfer",
                    query_id: 0n,
                    amount: value.toBigInt(),
                    destination: TonAddress.parse(recipient),
                    response_destination: TonAddress.parse(adaptor.address),
                    custom_payload: emptyCell,
                    forward_ton_amount: toNano("0.001"),    // For TokenNotifaction
                    forward_payload: emptyCell,
                  })
                ).endCell()
              
              const userTokenWalletAddress = await _getTokenWalletAddress(TonAddress.parse(address), TonAddress.parse(adaptor.address))

              return await adaptor.sendTransaction({
                to: userTokenWalletAddress,
                value: toNano("0.1"),      // For the whole token-transfer. Will be refunded if excess.
                body: packedData,
              })

            } else if (prop === 'addSupportToken') {
              const [tokenAddress, tokenIndex] = args

              const mesonTokenWalletAddress = await _getTokenWalletAddress(TonAddress.parse(tokenAddress), TonAddress.parse(address))

              let packedData = beginCell().store(
                  storeModifySupportToken({
                    $$type: "ModifySupportToken",
                    available: true,
                    token_index: BigInt(tokenIndex),
                    token_master_address: TonAddress.parse(tokenAddress),
                    meson_wallet_address: mesonTokenWalletAddress,
                  })
                ).endCell()
              
                return await adaptor.sendTransaction({
                  to: address,
                  value: toNano("0.1"), 
                  body: packedData,
                })

            } else if (prop === 'directRelease') {
              // const swap = Swap.decode(args[0])
              // const [_encoded, _r, _yParityAndS, _initiator, recipient] = args
              // const swapId = getSwapId(_encoded, _initiator)
              // return await (adaptor as BtcWallet).sendTransaction({
              //   swapId,
              //   to: recipient,
              //   value: swap.amount.sub(swap.fee).mul(100).toNumber(),
              // })
              throw new Error('TODO: TonContract.directRelease not implemented')
            } else if (prop === 'directExecuteSwap') {
              // const ? = Swap.decode(args[0])
              // return await (adaptor as BtcWallet).sendTransaction({
              //   to: address,
              //   value: swap.amount.mul(100).toNumber(),
              // })
              throw new Error('TODO: TonContract.directExecuteSwap not implemented')
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