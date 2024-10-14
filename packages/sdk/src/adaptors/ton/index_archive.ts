import { keyPairFromSecretKey } from '@ton/crypto'
import TonAdaptor from "./TonAdaptor";
import TonWallet, { TonExtWallet } from "./TonWallet";
import { BigNumber, BigNumberish } from 'ethers';
import { Swap } from '../../Swap';
import { beginCell, Dictionary, Address as TonAddress, toNano, TupleBuilder } from '@ton/core';
import { memoize } from 'lodash';
import { storeModifySupportToken, storeProxyTokenTransfer, storeProxyTokenTransferWithSwapid, storeTokenTransfer } from './types';
import { parseEther } from 'ethers/lib/utils';
import { getSwapId } from '../../utils';

function getContractOld(address: string, abi, adaptor: TonAdaptor) {
  const metadata = (<any>adaptor.client).metadata || {}

  const _getSupportedTokens = () => {
    const tokens = metadata.tokens || []
    return { tokens: tokens.map(t => t.addr), indexes: tokens.map(t => t.tokenIndex) }
  }

  const _getSupportedTokensInContract = memoize(async () => {
    const supportedTokensResultStack = (await adaptor.client.runMethod(TonAddress.parse(address), 'token_for_index_map')).stack
    const supportedTokensDict = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), supportedTokensResultStack.readCell())
    const indexes: number[] = []
    const tokens: string[] = []
    for (let i = 1n; i < 255n; i++) {
      const tokenAddress = supportedTokensDict.get(i)
      if (tokenAddress != undefined) {
        indexes.push(Number(i))
        tokens.push(tokenAddress.toString())
      }
    }
    return { tokens, indexes }
  })

  const _getTokenAddress = async (tokenIndex: number) => {
    const { tokens, indexes } = await _getSupportedTokens()
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

  const _buildTransfer = async (tokenAddress: string, sender: string, recipient: string, value: BigNumberish, forwardTonAmount: string, encodedSwap?: bigint) => {
    let packedData = beginCell().store(storeTokenTransfer({
      $$type: "TokenTransfer",
      query_id: 0n,
      amount: BigNumber.from(value).toBigInt(),
      destination: TonAddress.parse(recipient),
      response_destination: TonAddress.parse(sender),
      custom_payload: beginCell().endCell(),
      forward_ton_amount: toNano(forwardTonAmount),    // For token-notification.
      forward_payload: encodedSwap ?
        beginCell().storeInt(encodedSwap, 256).endCell() : beginCell().storeMaybeInt(null, 1).endCell(),
    })).endCell()
    const userTokenWalletAddress = await _getTokenWalletAddress(TonAddress.parse(tokenAddress), TonAddress.parse(sender))

    return {
      to: userTokenWalletAddress,
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
        return (wallet: TonWallet) => getContractOld(address, abi, wallet)
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
            } else if (prop === 'poolOfAuthorizedAddr') {
              return 0
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
              const txData = await _buildTransfer(
                address, adaptor.address, recipient, value,
                "0.001",  // For notification to normal recipient.
              )
              return await adaptor.sendTransaction(txData)

            } else if (prop === 'addSupportToken') {
              const [tokenAddress, tokenIndex] = args
              const mesonTokenWalletAddress = await _getTokenWalletAddress(TonAddress.parse(tokenAddress), TonAddress.parse(address))

              let packedData = beginCell().store(storeModifySupportToken({
                $$type: "ModifySupportToken",
                available: true,
                token_index: BigInt(tokenIndex),
                token_master_address: TonAddress.parse(tokenAddress),
                meson_wallet_address: mesonTokenWalletAddress,
              })).endCell()

              return await adaptor.sendTransaction({
                to: address,
                value: toNano("0.1"),
                body: packedData,
              })

            } else if (['depositAndRegister', 'deposit'].includes(prop)) {
              let [value, fakePoolTokenIndex] = args
              const tokenIndex = BigNumber.from(fakePoolTokenIndex).shr(40).toNumber()
              const tokenAddress = await _getTokenAddress(tokenIndex)

              const txData = await _buildTransfer(
                tokenAddress, adaptor.address, address, value,
                "0",  // No need to notify the meson contract when depositing.
              )
              return await adaptor.sendTransaction(txData)

            } else if (prop === 'withdraw') {
              let [value, fakePoolTokenIndex] = args
              const tokenIndex = BigNumber.from(fakePoolTokenIndex).shr(40).toNumber()
              const tokenAddress = await _getTokenAddress(tokenIndex)
              const mesonTokenWalletAddress = await _getTokenWalletAddress(TonAddress.parse(tokenAddress), TonAddress.parse(address))

              let packedData = beginCell().store(storeProxyTokenTransfer({
                $$type: "ProxyTokenTransfer",
                wallet_address: mesonTokenWalletAddress,
                token_transfer: {
                  $$type: "TokenTransfer",
                  query_id: 0n,
                  amount: BigInt(value),
                  destination: TonAddress.parse(adaptor.address),
                  response_destination: TonAddress.parse(adaptor.address),
                  custom_payload: beginCell().endCell(),
                  forward_ton_amount: toNano("0.001"),
                  forward_payload: beginCell().storeMaybeInt(null, 1).endCell(),
                }
              })).endCell()

              return await adaptor.sendTransaction({
                to: address,
                value: toNano("0.1"),
                body: packedData,
              })

            } else if (prop === 'directRelease') {
              let [swapId, recipient, tokenIndex, value] = args
              const tokenAddress = await _getTokenAddress(tokenIndex)
              const mesonTokenWalletAddress = await _getTokenWalletAddress(TonAddress.parse(tokenAddress), TonAddress.parse(address))

              let packedData = beginCell().store(storeProxyTokenTransferWithSwapid({
                $$type: "ProxyTokenTransferWithSwapid",
                swapid: BigInt(swapId),
                wallet_address: mesonTokenWalletAddress,
                token_transfer: {
                  $$type: "TokenTransfer",
                  query_id: 0n,
                  amount: BigInt(value),
                  destination: TonAddress.parse(recipient),
                  response_destination: TonAddress.parse(adaptor.address),
                  custom_payload: beginCell().endCell(),
                  forward_ton_amount: toNano("0.001"),
                  forward_payload: beginCell().storeMaybeInt(null, 1).endCell(),
                }
              })).endCell()

              return await adaptor.sendTransaction({
                to: address,
                value: toNano("0.1"),
                body: packedData,
              })

            } else if (prop === 'directExecuteSwap') {
              let [encoded, tokenIndex, value] = args
              encoded = encoded.startsWith('0x') ? BigInt(encoded) : BigInt('0x' + encoded)
              const tokenAddress = await _getTokenAddress(tokenIndex)

              const txData = await _buildTransfer(
                tokenAddress, adaptor.address, address, value,
                "0.1",  // Gas for sending back when encoded-swap duplicated.
                encoded,
              )
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
