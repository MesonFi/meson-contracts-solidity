import { BigNumber, BigNumberish, utils } from 'ethers'
import {
  SystemProgram,
  AccountMeta,
  Keypair as SolKeypair,
  PublicKey as SolPublicKey,
  Transaction as SolTransaction,
  TransactionInstruction as SolTransactionInstruction,
} from '@solana/web3.js'
import {
  getAccount,
  getMint,
  approve,
  transfer,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import memoize from 'lodash/memoize'
import bs58 from 'bs58'

import { getSwapId } from '../../utils'
import { Swap } from '../../Swap'
import SolanaAdaptor from './SolanaAdaptor'
import SolanaWallet, { SolanaExtWallet } from './SolanaWallet'

const SYSTEM_PROGRAM = {
  pubkey: SystemProgram.programId,
  isSigner: false,
  isWritable: false
}
const TOKEN_PROGRAM = {
  pubkey: TOKEN_PROGRAM_ID,
  isSigner: false,
  isWritable: false
}

const STORE_PREFIX = {
  CONTRACT_SIGNER: Buffer.from('contract_signer'),
  ADMIN: Buffer.from('admin'),
  SUPPORTED_TOKENS: Buffer.from('supported_tokens'),
  POSTED_SWAP: Buffer.from('posted_swap'),
  LOCKED_SWAP: Buffer.from('locked_swap'),
  POOL_OWNER: Buffer.from('pool_owner'),
  POOL_OF_AUTHORIZED_ACCOUNT: Buffer.from('pool_of_authorized_account'),
  BALANCE_OF_POOL: Buffer.from('balance_of_pool'),
}

const SOLANA_METHODS = [
  /* 00 */ 'init',
  /* 01 */ 'transferOwnership',
  /* 02 */ 'transferPremiumManager',
  /* 03 */ 'addSupportToken',
  /* 04 */ 'depositAndRegister',
  /* 05 */ 'deposit',
  /* 06 */ 'withdraw',
  /* 07 */ 'addAuthorizedAddr',
  /* 08 */ 'removeAuthorizedAddr',
  /* 09 */ 'transferPoolOwner',
  /* 10 */ 'withdrawServiceFee',
  /* 11 */ 'postSwapFromInitiator',
  /* 12 */ 'bondSwap',
  /* 13 */ 'cancelSwap',
  /* 14 */ 'executeSwap',
  /* 15 */ 'lockSwap',
  /* 16 */ 'unlock',
  /* 17 */ 'release',
  /* 18 */ 'directRelease',
]

export function getWallet(privateKey: string, adaptor: SolanaAdaptor, Wallet = SolanaWallet): SolanaWallet {
  let keypair: SolKeypair
  if (!privateKey) {
    keypair = SolKeypair.generate()
  } else if (Array.isArray(privateKey)) {
    // specific for solana
    keypair = SolKeypair.fromSecretKey(new Uint8Array(privateKey))
  } else if (privateKey.startsWith('0x')) {
    keypair = SolKeypair.fromSeed(utils.arrayify(privateKey))
  } else {
    // specific for solana
    keypair = SolKeypair.fromSecretKey(bs58.decode(privateKey))
  }
  return new Wallet(adaptor, keypair)
}

export function getWalletFromExtension(ext, adaptor: SolanaAdaptor): SolanaExtWallet {
  return new SolanaExtWallet(adaptor, ext)
}

export function getContract(address: string, abi, adaptor: SolanaAdaptor) {
  const programId = new SolPublicKey(address)

  const _getStore = (seeds: Buffer[]) => {
    return {
      pubkey: SolPublicKey.findProgramAddressSync(seeds, programId)[0],
      isSigner: false,
      isWritable: true,
    }
  }
  const stores = {
    contractSigner: _getStore([STORE_PREFIX.CONTRACT_SIGNER]),
    admin: _getStore([STORE_PREFIX.ADMIN]),
    supportedTokens: _getStore([STORE_PREFIX.SUPPORTED_TOKENS]),
  }

  const _getStoreBalanceOfPool = (poolIndex: number, tokenIndex: number) => {
    return _getStore([STORE_PREFIX.BALANCE_OF_POOL, _numToBuffer(poolIndex, 8), Buffer.from([tokenIndex])])
  }

  const _getAdmins = memoize(async () => {
    const { data } = await adaptor.client.getAccountInfo(stores.admin.pubkey)
    const owner = new SolPublicKey(data.subarray(0, 32))
    const premiumManager = new SolPublicKey(data.subarray(32, 64))
    return { owner, premiumManager }
  })

  const _getSupportedTokens = memoize(async () => {
    const { data } = await adaptor.client.getAccountInfo(stores.supportedTokens.pubkey)
    const indexes: number[] = []
    const tokens: string[] = []
    for (let i = 1; i < 255; i++) {
      const tokenAddr = new SolPublicKey(data.subarray(i * 32, (i + 1) * 32)).toString()
      if (tokenAddr !== SystemProgram.programId.toString()) {
        indexes.push(i)
        tokens.push(tokenAddr)
      }
    }
    return { tokens, indexes }
  })

  const _getTokenAddr = async (tokenIndex: number) => {
    const { tokens, indexes } = await _getSupportedTokens()
    const i = indexes.findIndex(i => i === tokenIndex)
    if (i === -1) {
      throw new Error(`Token index ${tokenIndex} not found.`)
    }
    return tokens[i]
  }

  const _getTokenIndex = async (tokenAddr: string) => {
    const { tokens, indexes } = await _getSupportedTokens()
    const i = tokens.findIndex(addr => addr === tokenAddr)
    if (i === -1) {
      throw new Error(`Token ${tokenAddr} not found.`)
    }
    return indexes[i]
  }

  // TODO: What if owner of pool is transferred?
  const _ownerOfPool = memoize(async (poolIndex: BigNumberish) => {
    if (poolIndex.toString() === '0') {
      return
    }
    const info = await adaptor.client.getAccountInfo(_getStore([
      STORE_PREFIX.POOL_OWNER,
      _numToBuffer(BigNumber.from(poolIndex).toNumber(), 8)
    ]).pubkey)
    if (!info) {
      return
    }
    return new SolPublicKey(info.data).toString()
  }, poolIndex => BigNumber.from(poolIndex).toString())

  const _poolOfAuthorizedAddr = async (addr: string) => {
    const info = await adaptor.client.getAccountInfo(_getStore([
      STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT,
      new SolPublicKey(addr).toBuffer()
    ]).pubkey)
    return info ? _bigNumberFromBuffer(info.data).toNumber() : 0
  }

  const _getTokenAccount = (token: string, owner: string | SolPublicKey) => {
    const tokenAccount = getAssociatedTokenAddressSync(
      new SolPublicKey(token),
      typeof owner === 'string' ? new SolPublicKey(owner) : owner,
      true
    )
    return { pubkey: tokenAccount, isSigner: false, isWritable: true }
  }

  const _getPostedSwap = async (encoded: string) => {
    const store = _getStore([STORE_PREFIX.POSTED_SWAP, Buffer.from(encoded.substring(2), 'hex')])
    const info = await adaptor.client.getAccountInfo(store.pubkey)
    if (!info) {
      return { exist: false }
    }
    const hex = utils.hexlify(info.data)
    const poolIndex = BigNumber.from(hex.substring(0, 18))
    const initiator = '0x' + hex.substring(18, 58)
    const fromAddressInHex = '0x' + hex.substring(58, 122)
    const fromAddress = new SolPublicKey(utils.arrayify(fromAddressInHex))
    const pending = BigNumber.from(fromAddressInHex).gt(0)
    return {
      initiator: pending ? initiator : undefined,
      poolOwner: pending ? await _ownerOfPool(poolIndex) : undefined,
      fromAddress,
      exist: true,
    }
  }

  type CallArguments = { keys: AccountMeta[], data?: number[], extraInstructions?: SolTransactionInstruction[] }
  const call = async (
    instructionId: number,
    getArgs: CallArguments | ((arg0: any) => CallArguments)
  ) => {
    const args = typeof getArgs === 'function' ? getArgs({ stores, SYSTEM_PROGRAM, TOKEN_PROGRAM }) : getArgs
    const { keys, data = [], extraInstructions = [] } = args
    const tx = new SolTransaction()
    extraInstructions.forEach(ins => tx.add(ins))
    tx.add(new SolTransactionInstruction({
      programId,
      keys,
      data: Buffer.from([instructionId, ...data]),
    }))
    return await (<SolanaWallet>adaptor).sendTransaction(tx)
  }

  return new Proxy({}, {
    get(target, prop: string) {
      if (prop === 'address') {
        return address
      } else if (prop === 'provider') {
        return adaptor
      } else if (prop === 'signer') {
        if (adaptor instanceof SolanaWallet) {
          return adaptor
        }
        throw new Error(`SolanaContract doesn't have a signer.`)
      } else if (prop === 'interface') {
        return {
          format: () => abi,
          parseTransaction: tx => {
            const [data, contractAddress = false] = tx.data.split('@')
            const name = SOLANA_METHODS[Number(data.substring(0, 4))]
            const args: any = { encodedSwap: '0x' + data.substring(4, 68) }
            if (contractAddress) {
              args.contractAddress = contractAddress
            }
            switch (name) {
              case 'postSwapFromInitiator':
                args.postingValue = BigNumber.from('0x' + data.substring(68, 108) + data.substring(114, 124))
                break
              case 'bondSwap':
              case 'cancelSwap':
                break
              case 'lockSwap':
              case 'unlock':
                args.initiator = '0x' + data.substring(68, 108)
                break
              case 'executeSwap':
                args.recipient = '0x' + data.substring(196, 236)
                break
              case 'directRelease':
              case 'release':
                args.initiator = '0x' + data.substring(196, 236)
                break
            }
            if (['executeSwap', 'release', 'directRelease'].includes(name)) {
              const { r, yParityAndS } = utils.splitSignature('0x' + data.substring(68, 196))
              args.r = r
              args.yParityAndS = yParityAndS
            }
            return { name, args }
          }
        }
      } else if (['queryFilter', 'on', 'removeAllListeners'].includes(prop)) {
        return () => {}
      } else if (prop === 'connect') {
        return (wallet: SolanaWallet) => getContract(address, abi, wallet)
      } else if (prop === 'filters') {
        throw new Error('SolanaContract.filters not implemented')
      } else if (prop === 'call') {
        return call
      } else if (prop === 'createTokenAccount') {
        return async (token: string, owner: string | SolPublicKey = stores.contractSigner.pubkey) => {
          return await getOrCreateAssociatedTokenAccount(
            adaptor.client,
            (<SolanaWallet>adaptor).keypair,
            new SolPublicKey(token),
            typeof owner === 'string' ? new SolPublicKey(owner) : owner,
            true,
          )
        }
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

            // ERC20 like
            if (prop === 'name') {
              // const data = await getMint(adaptor.client, new SolPublicKey(address))
            } else if (prop === 'symbol') {
              // const data = await getMint(adaptor.client, new SolPublicKey(address))
            } else if (prop === 'decimals') {
              const data = await getMint(adaptor.client, new SolPublicKey(address))
              return data.decimals
            } else if (prop === 'balanceOf') {
              const tokenAccount = _getTokenAccount(address, args[0])
              try {
                const data = await adaptor.client.getTokenAccountBalance(tokenAccount.pubkey)
                return BigNumber.from(data.value.amount)
              } catch {
                return BigNumber.from(0)
              }
            } else if (prop === 'allowance') {
              const tokenAccount = _getTokenAccount(address, args[0])
              const info = await adaptor.client.getAccountInfo(tokenAccount.pubkey)
              if (!info) {
                return BigNumber.from(0)
              }
              const spender = new SolPublicKey(info.data.subarray(76, 76 + 32))
              if (spender.toString() === args[1]) {
                return _bigNumberFromReverseBuffer(info.data.subarray(121, 121 + 8))
              }
              return BigNumber.from(0)
            }

            // Meson
            if (prop === 'getShortCoinType') {
              return '0x01f5'
            } else if (prop === 'getSupportedTokens') {
              return await _getSupportedTokens()
            } else if (prop === 'ownerOfPool') {
              return await _ownerOfPool(args[0])
            } else if (prop === 'poolOfAuthorizedAddr') {
              return await _poolOfAuthorizedAddr(args[0])
            } else if (prop === 'poolTokenBalance') {
              const [token, poolOwner] = args
              const poolIndex = await _poolOfAuthorizedAddr(poolOwner)
              const tokenIndex = await _getTokenIndex(token)
              if (!poolIndex || !tokenIndex) {
                return BigNumber.from(0)
              }
              const info = await adaptor.client.getAccountInfo(_getStoreBalanceOfPool(poolIndex, tokenIndex).pubkey)
              if (!info) {
                return BigNumber.from(0)
              }
              return _bigNumberFromBuffer(info.data.subarray(0, 8))
            } else if (prop === 'serviceFeeCollected') {
              const [tokenIndex] = args
              if (!tokenIndex) {
                return BigNumber.from(0)
              }
              const info = await adaptor.client.getAccountInfo(_getStoreBalanceOfPool(0, tokenIndex).pubkey)
              if (!info) {
                return BigNumber.from(0)
              }
              return _bigNumberFromBuffer(info.data.subarray(0, 8))
            } else if (prop === 'getPostedSwap') {
              const encoded = Swap.decode(args[0]).encoded
              return await _getPostedSwap(encoded)
            } else if (prop === 'getLockedSwap') {
              const encoded = Swap.decode(args[0]).encoded
              const swapId = getSwapId(encoded, args[1])
              const store = _getStore([STORE_PREFIX.LOCKED_SWAP, Buffer.from(swapId.substring(2), 'hex')])
              const info = await adaptor.client.getAccountInfo(store.pubkey)
              if (!info) {
                return { until: 0 } // never locked
              }
              const hex = utils.hexlify(info.data)
              const poolIndex = BigNumber.from(hex.substring(0, 18))
              const until = BigNumber.from('0x' + hex.substring(18, 34)).toNumber()
              if (until) {
                return { until, poolOwner: await _ownerOfPool(poolIndex) }
              } else if (poolIndex.gt(0)) {
                return { until: 0, poolOwner: '0x1' } // released
              } else {
                return { until: 0 } // unlocked
              }
            }

            throw new Error(`SolanaContract read not implemented (${prop})`)
          }
        } else {
          const signerPubkey = (<SolanaWallet>adaptor).publicKey
          return async (...args) => {
            let options
            if (args.length > method.inputs.length) {
              options = args.pop()
            }

            if (prop === 'transfer') {
              const tokenAccount = _getTokenAccount(address, signerPubkey)
              const destination = await getOrCreateAssociatedTokenAccount(
                adaptor.client,
                (<SolanaWallet>adaptor).keypair,
                new SolPublicKey(address),
                new SolPublicKey(args[0]),
                true,
              )
              const hash = await transfer(
                adaptor.client,
                (<SolanaWallet>adaptor).keypair,
                tokenAccount.pubkey,
                destination.address,
                signerPubkey,
                args[1].toNumber()
              )
              return { hash, wait: () => adaptor.waitForTransaction(hash) }
            } else if (prop === 'approve') {
              const [spender, amount] = args
              const tokenAccount = _getTokenAccount(address, signerPubkey)
              const hash = await approve(
                adaptor.client,
                (<SolanaWallet>adaptor).keypair,
                tokenAccount.pubkey,
                new SolPublicKey(spender),
                signerPubkey,
                amount.toNumber(),
              )
              return { hash, wait: () => adaptor.waitForTransaction(hash) }
            } else if (prop === 'transferOwnership') {
              const [newOwner] = args
              return await call(1, {
                data: [],
                keys: [
                  stores.admin,
                  { pubkey: signerPubkey, isSigner: true, isWritable: false },
                  { pubkey: new SolPublicKey(newOwner), isSigner: false, isWritable: false },
                ],
              })
            } else if (prop === 'transferPremiumManager') {
              const [newPremiumManager] = args
              return await call(2, {
                data: [],
                keys: [
                  stores.admin,
                  { pubkey: signerPubkey, isSigner: true, isWritable: false },
                  { pubkey: new SolPublicKey(newPremiumManager), isSigner: false, isWritable: false },
                ],
              })
            } else if (prop === 'addSupportToken') {
              const [_tokenAddr, tokenIndex] = args
              const tokenAddr = _tokenAddr.startsWith('0x') ? 1 : _tokenAddr
              const { owner } = await _getAdmins()
              return await call(3, {
                data: [tokenIndex],
                keys: [
                  SYSTEM_PROGRAM,
                  { pubkey: owner, isSigner: true, isWritable: false },
                  stores.admin,
                  stores.supportedTokens,
                  _getStoreBalanceOfPool(0, tokenIndex),
                  { pubkey: new SolPublicKey(tokenAddr), isSigner: false, isWritable: false },
                ],
              })
            } else if (prop === 'depositAndRegister') {
              const amount = BigNumber.from(args[0]).toNumber()
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toNumber()
              return await call(4, {
                data: [..._numToBuffer(poolIndex, 8)],
                keys: [
                  SYSTEM_PROGRAM,
                  _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                  _getStore([STORE_PREFIX.POOL_OWNER, _numToBuffer(poolIndex, 8)]),
                  { pubkey: signerPubkey, isSigner: true, isWritable: false },
                ],
              })
            } else if (prop === 'deposit') {
              const amount = BigNumber.from(args[0]).toNumber()
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toNumber()
              const tokenAddr = await _getTokenAddr(tokenIndex)
              return await call(5, {
                data: [tokenIndex, ..._numToBuffer(amount, 8)],
                keys: [
                  SYSTEM_PROGRAM,
                  TOKEN_PROGRAM,
                  _getTokenAccount(tokenAddr, stores.contractSigner.pubkey),
                  { pubkey: new SolPublicKey(tokenAddr), isSigner: false, isWritable: false },
                  stores.contractSigner,
                  stores.supportedTokens,
                  _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                  _getStoreBalanceOfPool(poolIndex, tokenIndex),
                  { pubkey: signerPubkey, isSigner: true, isWritable: true },
                  _getTokenAccount(tokenAddr, signerPubkey),
                ],
              })
            } else if (prop === 'withdraw') {
              const amount = BigNumber.from(args[0]).toNumber()
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toNumber()
              const tokenAddr = await _getTokenAddr(tokenIndex)
              return await call(6, {
                data: [tokenIndex, ..._numToBuffer(amount, 8)],
                keys: [
                  SYSTEM_PROGRAM,
                  TOKEN_PROGRAM,
                  _getTokenAccount(tokenAddr, stores.contractSigner.pubkey),
                  { pubkey: new SolPublicKey(tokenAddr), isSigner: false, isWritable: false },
                  stores.contractSigner,
                  stores.supportedTokens,
                  _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                  _getStore([STORE_PREFIX.POOL_OWNER, _numToBuffer(poolIndex, 8)]),
                  _getStoreBalanceOfPool(poolIndex, tokenIndex),
                  { pubkey: signerPubkey, isSigner: true, isWritable: true },
                  _getTokenAccount(tokenAddr, signerPubkey),
                ],
              })
            } else if (prop === 'addAuthorizedAddr') {
              const pubkey = new SolPublicKey(args[0])
              const poolIndex = await _poolOfAuthorizedAddr(signerPubkey.toString())
              return await call(7, {
                keys: [
                  SYSTEM_PROGRAM,
                  _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                  _getStore([STORE_PREFIX.POOL_OWNER, _numToBuffer(poolIndex, 8)]),
                  _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, pubkey.toBuffer()]),
                  { pubkey: signerPubkey, isSigner: true, isWritable: false },
                  { pubkey, isSigner: false, isWritable: false },
                ],
              })
            } else if (prop === 'removeAuthorizedAddr') {
              const pubkey = new SolPublicKey(args[0])
              const poolIndex = await _poolOfAuthorizedAddr(signerPubkey.toString())
              return await call(8, {
                keys: [
                  _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                  _getStore([STORE_PREFIX.POOL_OWNER, _numToBuffer(poolIndex, 8)]),
                  _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, pubkey.toBuffer()]),
                  { pubkey: signerPubkey, isSigner: true, isWritable: false },
                  { pubkey, isSigner: false, isWritable: false },
                ],
              })
            } else if (prop === 'transferPoolOwner') {
              const pubkey = new SolPublicKey(args[0])
              const poolIndex = await _poolOfAuthorizedAddr(signerPubkey.toString())
              return await call(9, {
                keys: [
                  _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                  _getStore([STORE_PREFIX.POOL_OWNER, _numToBuffer(poolIndex, 8)]),
                  _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, pubkey.toBuffer()]),
                  { pubkey: signerPubkey, isSigner: true, isWritable: false },
                  { pubkey, isSigner: false, isWritable: false },
                ],
              })
            } else if (prop === 'withdrawServiceFee') {
              const tokenIndex = args[0]
              const amount = BigNumber.from(args[1]).toNumber()
              const toPoolIndex = args[2]
              return await call(10, {
                data: [
                  tokenIndex,
                  ..._numToBuffer(amount, 8),
                  ..._numToBuffer(toPoolIndex, 8),
                ],
                keys: [
                  stores.admin,
                  _getStore([STORE_PREFIX.POOL_OWNER, _numToBuffer(toPoolIndex, 8)]),
                  _getStoreBalanceOfPool(0, tokenIndex),
                  _getStoreBalanceOfPool(toPoolIndex, tokenIndex),
                  { pubkey: signerPubkey, isSigner: true, isWritable: false },
                ],
              })
            } else {
              const swap = Swap.decode(args[0])
              if (prop === 'postSwapFromInitiator') {
                const [_, postingValue] = args
                const tokenAddr = await _getTokenAddr(swap.inToken)
                return await call(11, {
                  data: [
                    ...utils.arrayify(swap.encoded),
                    ...utils.arrayify(postingValue.substring(0, 42)),
                    ...utils.arrayify(`0x000000${postingValue.substring(42)}`),
                  ],
                  keys: [
                    SYSTEM_PROGRAM,
                    TOKEN_PROGRAM,
                    _getTokenAccount(tokenAddr, stores.contractSigner.pubkey),
                    { pubkey: new SolPublicKey(tokenAddr), isSigner: false, isWritable: false },
                    stores.contractSigner,
                    stores.supportedTokens,
                    _getStore([STORE_PREFIX.POSTED_SWAP, Buffer.from(swap.encoded.substring(2), 'hex')]),
                    { pubkey: signerPubkey, isSigner: true, isWritable: true },
                    _getTokenAccount(tokenAddr, signerPubkey),
                  ],
                })
              } else if (prop === 'bondSwap') {
                return await call(12, {
                  data: [...utils.arrayify(swap.encoded)],
                  keys: [
                    _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                    _getStore([STORE_PREFIX.POSTED_SWAP, Buffer.from(swap.encoded.substring(2), 'hex')]),
                    { pubkey: signerPubkey, isSigner: true, isWritable: true },
                  ],
                })
              } else if (prop === 'cancelSwap') {
                const tokenAddr = await _getTokenAddr(swap.inToken)
                const posted =  await _getPostedSwap(swap.encoded)
                if (!posted?.fromAddress) {
                  throw new Error('No posted swap')
                }
                return await call(13, {
                  data: [...utils.arrayify(swap.encoded)],
                  keys: [
                    SYSTEM_PROGRAM,
                    TOKEN_PROGRAM,
                    _getTokenAccount(tokenAddr, stores.contractSigner.pubkey),
                    { pubkey: new SolPublicKey(tokenAddr), isSigner: false, isWritable: false },
                    stores.contractSigner,
                    _getStore([STORE_PREFIX.POSTED_SWAP, Buffer.from(swap.encoded.substring(2), 'hex')]),
                    { pubkey: new SolPublicKey(posted.fromAddress), isSigner: false, isWritable: true },
                    _getTokenAccount(tokenAddr, posted.fromAddress),
                  ],
                })
              } else if (prop === 'executeSwap') {
                const [_, r, yParityAndS, recipient, depositToPool] = args
                const poolIndex = await _poolOfAuthorizedAddr(signerPubkey.toString())
                return await call(14, {
                  data: [
                    ...utils.arrayify(swap.encoded),
                    ...utils.arrayify(r),
                    ...utils.arrayify(yParityAndS),
                    ...utils.arrayify(recipient),
                  ],
                  keys: [
                    _getStoreBalanceOfPool(poolIndex, swap.inToken),
                    _getStore([STORE_PREFIX.POSTED_SWAP, Buffer.from(swap.encoded.substring(2), 'hex')]),
                  ],
                })
              } else if (prop === 'lockSwap') {
                const [_, { initiator, recipient }] = args
                const tokenAddr = await _getTokenAddr(swap.outToken)
                const swapId = getSwapId(swap.encoded, initiator)
                const poolIndex = await _poolOfAuthorizedAddr(signerPubkey.toString())
                return await call(15, {
                  data: [
                    ...utils.arrayify(swap.encoded),
                    ...utils.arrayify(initiator),
                    ...new SolPublicKey(recipient).toBuffer(),
                  ],
                  keys: [
                    SYSTEM_PROGRAM,
                    { pubkey: new SolPublicKey(tokenAddr), isSigner: false, isWritable: false },
                    { ...stores.supportedTokens, isWritable: false },
                    _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                    _getStoreBalanceOfPool(poolIndex, swap.outToken),
                    _getStoreBalanceOfPool(poolIndex, 247),
                    _getStore([STORE_PREFIX.LOCKED_SWAP, Buffer.from(swapId.substring(2), 'hex')]),
                    { pubkey: signerPubkey, isSigner: true, isWritable: false },
                  ],
                })
              } else if (prop === 'unlock') {
                const [_, initiator] = args
                const swapId = getSwapId(swap.encoded, initiator)
                const poolIndex = await _poolOfAuthorizedAddr(signerPubkey.toString())
                return await call(16, {
                  data: [
                    ...utils.arrayify(swap.encoded),
                    ...utils.arrayify(initiator),
                  ],
                  keys: [
                    _getStoreBalanceOfPool(poolIndex, swap.outToken),
                    _getStoreBalanceOfPool(poolIndex, 247),
                    _getStore([STORE_PREFIX.LOCKED_SWAP, Buffer.from(swapId.substring(2), 'hex')]),
                  ],
                })
              } else if (prop === 'release') {
                const [_, r, yParityAndS, initiator, recipient] = args
                const tokenAddr = await _getTokenAddr(swap.outToken)
                const swapId = getSwapId(swap.encoded, initiator)
                const taRecipient = _getTokenAccount(tokenAddr, recipient)
                
                const extraInstructions = []
                try {
                  await getAccount(adaptor.client, taRecipient.pubkey, undefined, TOKEN_PROGRAM_ID)
                } catch (e) {
                  if (e instanceof TokenAccountNotFoundError || e instanceof TokenInvalidAccountOwnerError) {
                    extraInstructions.push(createAssociatedTokenAccountInstruction(
                      signerPubkey,
                      taRecipient.pubkey,
                      new SolPublicKey(recipient),
                      new SolPublicKey(tokenAddr),
                      TOKEN_PROGRAM_ID,
                      ASSOCIATED_TOKEN_PROGRAM_ID
                    ))
                  }
                }
                return await call(17, {
                  data: [
                    ...utils.arrayify(swap.encoded),
                    ...utils.arrayify(r),
                    ...utils.arrayify(yParityAndS),
                    ...utils.arrayify(initiator),
                  ],
                  keys: [
                    SYSTEM_PROGRAM,
                    TOKEN_PROGRAM,
                    _getTokenAccount(tokenAddr, stores.contractSigner.pubkey),
                    { pubkey: new SolPublicKey(tokenAddr), isSigner: false, isWritable: false },
                    stores.contractSigner,
                    stores.admin,
                    _getStoreBalanceOfPool(0, swap.outToken),
                    _getStore([STORE_PREFIX.LOCKED_SWAP, Buffer.from(swapId.substring(2), 'hex')]),
                    { pubkey: signerPubkey, isSigner: true, isWritable: false },
                    { pubkey: new SolPublicKey(recipient), isSigner: false, isWritable: true },
                    _getTokenAccount(tokenAddr, recipient),
                  ],
                  extraInstructions,
                })
              } else if (prop === 'directRelease') {
                const [_, r, yParityAndS, initiator, recipient] = args
                const tokenAddr = await _getTokenAddr(swap.outToken)
                const swapId = getSwapId(swap.encoded, initiator)
                const poolIndex = await _poolOfAuthorizedAddr(signerPubkey.toString())
                const taRecipient = _getTokenAccount(tokenAddr, recipient)

                const extraInstructions = []
                try {
                  await getAccount(adaptor.client, taRecipient.pubkey, undefined, TOKEN_PROGRAM_ID)
                } catch (e) {
                  if (e instanceof TokenAccountNotFoundError || e instanceof TokenInvalidAccountOwnerError) {
                    extraInstructions.push(createAssociatedTokenAccountInstruction(
                      signerPubkey,
                      taRecipient.pubkey,
                      new SolPublicKey(recipient),
                      new SolPublicKey(tokenAddr),
                      TOKEN_PROGRAM_ID,
                      ASSOCIATED_TOKEN_PROGRAM_ID
                    ))
                  }
                }
                return await call(18, {
                  data: [
                    ...utils.arrayify(swap.encoded),
                    ...utils.arrayify(r),
                    ...utils.arrayify(yParityAndS),
                    ...utils.arrayify(initiator),
                  ],
                  keys: [
                    SYSTEM_PROGRAM,
                    TOKEN_PROGRAM,
                    _getTokenAccount(tokenAddr, stores.contractSigner.pubkey),
                    { pubkey: new SolPublicKey(tokenAddr), isSigner: false, isWritable: false },
                    stores.contractSigner,
                    stores.admin,
                    stores.supportedTokens,
                    _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                    _getStoreBalanceOfPool(poolIndex, swap.outToken),
                    _getStoreBalanceOfPool(poolIndex, 247),
                    _getStoreBalanceOfPool(0, swap.outToken),
                    _getStore([STORE_PREFIX.LOCKED_SWAP, Buffer.from(swapId.substring(2), 'hex')]),
                    { pubkey: signerPubkey, isSigner: true, isWritable: false },
                    { pubkey: new SolPublicKey(recipient), isSigner: false, isWritable: true },
                    taRecipient,
                  ],
                  extraInstructions,
                })
              }
            }
          }
        }
      }
      return target[prop]
    }
  })
}

function _numToBuffer(num: number, length: number) {
  return Buffer.from(num.toString(16).padStart(length * 2, '0'), 'hex')
}

function _bigNumberFromBuffer(buffer: Buffer) {
  return BigNumber.from('0x' + Array.from(buffer).map(x => x.toString(16).padStart(2, '0')).join(''))
}

function _bigNumberFromReverseBuffer(buffer: Buffer) {
  return BigNumber.from('0x' + Array.from(buffer).reverse().map(x => x.toString(16).padStart(2, '0')).join(''))
}

export function formatAddress(addr: string) {
  try {
    return new SolPublicKey(addr).toString()
  } catch {
    return
  }
}
