import { keyPairFromSecretKey } from '@ton/crypto'
import TonAdaptor from "./TonAdaptor";
import TonWallet from "./TonWallet";
import { BigNumber } from 'ethers';
import { Swap } from '../../Swap';

export function getWallet(privateKey: string, adaptor: TonAdaptor, Wallet = TonWallet): TonWallet {
  // Notice that TON_PRIVATE_KEY has 64 bytes
  const derivedKey = privateKey.startsWith('0x') ?
    privateKey.substring(2) + privateKey.substring(2) : privateKey + privateKey
  const keypair = keyPairFromSecretKey(Buffer.from(derivedKey, 'hex'))
  return new Wallet(adaptor, keypair)
}

export function getContract(address: string, abi, adaptor: TonAdaptor) {
  const tokens = (<any>adaptor.client).tokens || {}

  const _getSupportedTokens = async () => {
    return { tokens: tokens.map(t => t.addr), indexes: tokens.map(t => t.tokenIndex) }
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
        }
        throw new Error(`TonContract doesn't have a signer.`)
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
              return 'Ton'
            } else if (prop === 'symbol') {
              return 'TON'
            } else if (prop === 'decimals') {
              return 9
            } else if (prop === 'balanceOf') {
              return await adaptor.getBalance(args[0])
            } else if (prop === 'allowance') {
              return BigNumber.from(0)
            }

            // Meson
            if (prop === 'getShortCoinType') {
              // See https://github.com/satoshilabs/slips/blob/master/slip-0044.md?plain=1#L638
              return '0x025f'
            } else if (prop === 'getSupportedTokens') {
              // return { tokens: ['0x0000000000000000000000000000000000000001'], indexes: [243] }
              return _getSupportedTokens()
            } else if (prop === 'poolTokenBalance') {
              const balance = await adaptor.getBalance(address)
              return balance.div(1000) // decimals 9 -> 6
            } else if (prop === 'serviceFeeCollected') {
              return BigNumber.from(0)
            }
          }
        } else {
          return async (...args) => {
            let options
            if (args.length > method.inputs.length) {
              options = args.pop()
            }

            const swap = Swap.decode(args[0])
            if (prop === 'directRelease') {
              // const [_encoded, _r, _yParityAndS, _initiator, recipient] = args
              // const swapId = getSwapId(_encoded, _initiator)
              // return await (adaptor as BtcWallet).sendTransaction({
              //   swapId,
              //   to: recipient,
              //   value: swap.amount.sub(swap.fee).mul(100).toNumber(),
              // })
              throw new Error('TODO: TonContract.directRelease not implemented')
            } else if (prop === 'directExecuteSwap') {
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