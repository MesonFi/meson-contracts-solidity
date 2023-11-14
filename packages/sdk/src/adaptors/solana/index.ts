import { BigNumber, BigNumberish, utils } from 'ethers'
import sol, { SystemProgram } from '@solana/web3.js'
import {
  getMint,
  approve,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import memoize from 'lodash/memoize'
import bs58 from 'bs58'

import SolanaAdaptor from './SolanaAdaptor'
import SolanaWallet, { SolanaExtWallet } from './SolanaWallet'
import { Swap } from '../../Swap'

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

export function getWallet(privateKey: string, client: sol.Connection): SolanaWallet {
  let keypair: sol.Keypair
  if (!privateKey) {
    keypair = sol.Keypair.generate()
  } else if (privateKey.startsWith('0x')) {
    keypair = sol.Keypair.fromSeed(utils.arrayify(privateKey))
  } else if (Array.isArray(privateKey)) { // specific for solana
    keypair = sol.Keypair.fromSecretKey(new Uint8Array(privateKey))
  } else {
    keypair = sol.Keypair.fromSecretKey(bs58.decode(privateKey))
  }
  return new SolanaWallet(client, keypair)
}

export function getWalletFromExtension(ext, client: sol.Connection): SolanaExtWallet {
  return new SolanaExtWallet(client, ext)
}

export function getContract(address, abi, clientOrAdaptor: sol.Connection | SolanaAdaptor) {
  let adaptor: SolanaAdaptor
  if (clientOrAdaptor instanceof SolanaWallet) {
    adaptor = clientOrAdaptor
  } else if (clientOrAdaptor instanceof SolanaAdaptor) {
    adaptor = clientOrAdaptor
  } else {
    adaptor = new SolanaAdaptor(clientOrAdaptor)
  }

  const programId = new sol.PublicKey(address)

  const _getStore = (seeds: Buffer[]) => {
    return {
      pubkey: sol.PublicKey.findProgramAddressSync(seeds, programId)[0],
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
    const admin = new sol.PublicKey(data.subarray(0, 32))
    const premiumManager = new sol.PublicKey(data.subarray(32, 64))
    return { admin, premiumManager }
  })

  const _getSupportedTokens = memoize(async () => {
    const { data } = await adaptor.client.getAccountInfo(stores.supportedTokens.pubkey)
    const indexes: number[] = []
    const tokens: string[] = []
    for (let i = 1; i < 255; i++) {
      const tokenAddr = new sol.PublicKey(data.subarray(i * 32, (i + 1) * 32)).toString()
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
    return new sol.PublicKey(info.data).toString()
  }, poolIndex => BigNumber.from(poolIndex).toString())

  const _poolOfAuthorizedAddr = async (addr: string) => {
    const info = await adaptor.client.getAccountInfo(_getStore([
      STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT,
      new sol.PublicKey(addr).toBuffer()
    ]).pubkey)
    return info ? _bigNumberFromBuffer(info.data).toNumber() : 0
  }

  const _getTokenAccount = (token: string, owner: string | sol.PublicKey) => {
    const tokenAccount = getAssociatedTokenAddressSync(
      new sol.PublicKey(token),
      typeof owner === 'string' ? new sol.PublicKey(owner) : owner,
      true
    )
    return { pubkey: tokenAccount, isSigner: false, isWritable: true }
  }

  const call = async (instructionId: number, getArguments: (arg0: any) => { keys: sol.AccountMeta[], data?: number[] }) => {
    const { keys, data = [] } = getArguments({ stores, SYSTEM_PROGRAM, TOKEN_PROGRAM })
    const tx = new sol.Transaction().add(new sol.TransactionInstruction({
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
        return async (token: string, owner: string | sol.PublicKey = stores.contractSigner.pubkey) => {
          return await getOrCreateAssociatedTokenAccount(
            adaptor.client,
            (<SolanaWallet>adaptor).keypair,
            new sol.PublicKey(token),
            typeof owner === 'string' ? new sol.PublicKey(owner) : owner,
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
              // const data = await getMint(adaptor.client, new sol.PublicKey(address))
            } else if (prop === 'symbol') {
              // const data = await getMint(adaptor.client, new sol.PublicKey(address))
            } else if (prop === 'decimals') {
              const data = await getMint(adaptor.client, new sol.PublicKey(address))
              return data.decimals
            } else if (prop === 'balanceOf') {
              const tokenAccount = _getTokenAccount(address, args[0])
              const data = await adaptor.client.getTokenAccountBalance(tokenAccount.pubkey)
              return BigNumber.from(data.value.amount)
            } else if (prop === 'allowance') {
              const tokenAccount = _getTokenAccount(address, args[0])
              const info = await adaptor.client.getAccountInfo(tokenAccount.pubkey)
              if (!info) {
                return BigNumber.from(0)
              }
              const spender = new sol.PublicKey(info.data.subarray(76, 76 + 32))
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
            } else if (prop === 'getLockedSwap') {
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
            } else if (prop === 'approve') {
              const [spender, amount] = args
              const tokenAccount = _getTokenAccount(address, signerPubkey)
              const hash = await approve(
                adaptor.client,
                (<SolanaWallet>adaptor).keypair,
                tokenAccount.pubkey,
                new sol.PublicKey(spender),
                signerPubkey,
                amount.toNumber(),
              )
              return { hash, wait: () => adaptor.waitForTransaction(hash) }
            } else if (prop === 'addSupportToken') {
              const [tokenAddr, tokenIndex] = args
              const { admin } = await _getAdmins()
              return await call(3, ({ stores, SYSTEM_PROGRAM }) => ({
                data: [tokenIndex],
                keys: [
                  SYSTEM_PROGRAM,
                  { pubkey: admin },
                  stores.admin,
                  stores.supportedTokens,
                  _getStoreBalanceOfPool(0, tokenIndex),
                  { pubkey: new sol.PublicKey(tokenAddr) },
                ],
              }))
            } else if (prop === 'depositAndRegister') {
              const amount = BigNumber.from(args[0]).toNumber()
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toNumber()
              return await call(4, ({ SYSTEM_PROGRAM }) => ({
                data: [..._numToBuffer(poolIndex, 8)],
                keys: [
                  SYSTEM_PROGRAM,
                  _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                  _getStore([STORE_PREFIX.POOL_OWNER, _numToBuffer(poolIndex, 8)]),
                  { pubkey: signerPubkey, isSigner: true },
                ],
              }))
            } else if (prop === 'deposit') {
              const amount = BigNumber.from(args[0]).toNumber()
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toNumber()
              const tokenAddr = await _getTokenAddr(tokenIndex)
              return await call(5, ({ SYSTEM_PROGRAM, TOKEN_PROGRAM }) => ({
                data: [tokenIndex, ..._numToBuffer(amount, 8)],
                keys: [
                  SYSTEM_PROGRAM,
                  TOKEN_PROGRAM,
                  _getTokenAccount(tokenAddr, stores.contractSigner.pubkey),
                  { pubkey: new sol.PublicKey(tokenAddr) },
                  stores.supportedTokens,
                  _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                  _getStoreBalanceOfPool(poolIndex, tokenIndex),
                  { pubkey: signerPubkey, isSigner: true, isWritable: true },
                  _getTokenAccount(tokenAddr, signerPubkey),
                ],
              }))
            } else if (prop === 'withdraw') {
              const amount = BigNumber.from(args[0]).toNumber()
              const poolTokenIndex = BigNumber.from(args[1])
              const tokenIndex = poolTokenIndex.div(2 ** 40).toNumber()
              const poolIndex = poolTokenIndex.mod(BigNumber.from(2).pow(40)).toNumber()
              const tokenAddr = await _getTokenAddr(tokenIndex)
              return await call(6, ({ TOKEN_PROGRAM }) => ({
                data: [tokenIndex, ..._numToBuffer(amount, 8)],
                keys: [
                  TOKEN_PROGRAM,
                  _getTokenAccount(tokenAddr, stores.contractSigner.pubkey),
                  { pubkey: new sol.PublicKey(tokenAddr) },
                  stores.contractSigner,
                  stores.supportedTokens,
                  _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                  _getStore([STORE_PREFIX.POOL_OWNER, _numToBuffer(poolIndex, 8)]),
                  _getStoreBalanceOfPool(poolIndex, tokenIndex),
                  { pubkey: signerPubkey, isSigner: true, isWritable: true },
                  _getTokenAccount(tokenAddr, signerPubkey),
                ],
              }))
            } else if (['addAuthorizedAddr', 'removeAuthorizedAddr', 'transferPoolOwner'].includes(prop)) {
            } else if (prop === 'withdrawServiceFee') {
            } else {
              const swap = Swap.decode(args[0])
              if (prop === 'postSwapFromInitiator') {
                const [_, postingValue] = args
                const tokenAddr = await _getTokenAddr(swap.inToken)
                return await call(11, ({ SYSTEM_PROGRAM, TOKEN_PROGRAM }) => ({
                  data: [
                    ...utils.arrayify(swap.encoded),
                    ...utils.arrayify(postingValue.substring(0, 42)),
                    ...utils.arrayify(`0x000000${postingValue.substring(42)}`),
                  ],
                  keys: [
                    SYSTEM_PROGRAM,
                    TOKEN_PROGRAM,
                    _getTokenAccount(tokenAddr, stores.contractSigner.pubkey),
                    { pubkey: new sol.PublicKey(tokenAddr) },
                    stores.supportedTokens,
                    _getStore([STORE_PREFIX.POSTED_SWAP, Buffer.from(swap.encoded.substring(2), 'hex')]),
                    { pubkey: signerPubkey, isSigner: true, isWritable: true },
                    _getTokenAccount(tokenAddr, signerPubkey),
                  ],
                }))
              } else if (prop === 'bondSwap') {
                return await call(12, () => ({
                  data: [...utils.arrayify(swap.encoded)],
                  keys: [
                    _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                    _getStore([STORE_PREFIX.POSTED_SWAP, Buffer.from(swap.encoded.substring(2), 'hex')]),
                    { pubkey: signerPubkey, isSigner: true, isWritable: true },
                  ],
                }))
              } else if (prop === 'cancelSwap') {
              } else if (prop === 'executeSwap') {
                const [_, r, yParityAndS, recipient, depositToPool] = args
                const poolIndex = await _poolOfAuthorizedAddr(signerPubkey.toString())
                const tokenAddr = await _getTokenAddr(swap.inToken)
                return await call(14, ({ TOKEN_PROGRAM }) => ({
                  data: [
                    ...utils.arrayify(swap.encoded),
                    ...utils.arrayify(r),
                    ...utils.arrayify(yParityAndS),
                    ...new sol.PublicKey(recipient).toBuffer(),
                    depositToPool ? 1 : 0,
                  ],
                  keys: [
                    TOKEN_PROGRAM,
                    _getTokenAccount(tokenAddr, stores.contractSigner.pubkey),
                    { pubkey: new sol.PublicKey(tokenAddr), isSigner: false, isWritable: false },
                    stores.contractSigner,
                    _getStore([STORE_PREFIX.POOL_OWNER, _numToBuffer(poolIndex, 8)]),
                    _getStoreBalanceOfPool(poolIndex, swap.inToken),
                    _getStore([STORE_PREFIX.POSTED_SWAP, Buffer.from(swap.encoded.substring(2), 'hex')]),
                    _getTokenAccount(tokenAddr, signerPubkey),
                  ],
                }))
              } else if (prop === 'lockSwap') {
                const [_, { initiator, recipient }] = args
                const tokenAddr = await _getTokenAddr(swap.outToken)
                const swapId = _getSwapId(swap.encoded, initiator)
                const poolIndex = await _poolOfAuthorizedAddr(signerPubkey.toString())
                return await call(15, ({ SYSTEM_PROGRAM }) => ({
                  data: [
                    ...utils.arrayify(swap.encoded),
                    ...utils.arrayify(initiator),
                    ...new sol.PublicKey(recipient).toBuffer(),
                  ],
                  keys: [
                    SYSTEM_PROGRAM,
                    { pubkey: new sol.PublicKey(tokenAddr), isSigner: false, isWritable: false },
                    { ...stores.supportedTokens, isWritable: false },
                    _getStore([STORE_PREFIX.POOL_OF_AUTHORIZED_ACCOUNT, signerPubkey.toBuffer()]),
                    _getStoreBalanceOfPool(poolIndex, swap.outToken),
                    _getStore([STORE_PREFIX.LOCKED_SWAP, Buffer.from(swapId.substring(2), 'hex')]),
                    { pubkey: signerPubkey, isSigner: true, isWritable: false },
                  ],
                }))
              } else if (prop === 'unlock') {
              } else if (prop === 'release') {
                const [_, r, yParityAndS, initiator, recipient] = args
                const tokenAddr = await _getTokenAddr(swap.outToken)
                const swapId = _getSwapId(swap.encoded, initiator)
                return await call(17, ({ TOKEN_PROGRAM }) => ({
                  data: [
                    ...utils.arrayify(swap.encoded),
                    ...utils.arrayify(r),
                    ...utils.arrayify(yParityAndS),
                    ...utils.arrayify(initiator),
                  ],
                  keys: [
                    TOKEN_PROGRAM,
                    _getTokenAccount(tokenAddr, stores.contractSigner.pubkey),
                    { pubkey: new sol.PublicKey(tokenAddr), isSigner: false, isWritable: false },
                    stores.contractSigner,
                    stores.admin,
                    _getStoreBalanceOfPool(0, swap.outToken),
                    _getStore([STORE_PREFIX.LOCKED_SWAP, Buffer.from(swapId.substring(2), 'hex')]),
                    { pubkey: signerPubkey, isSigner: true, isWritable: false },
                    _getTokenAccount(tokenAddr, new sol.PublicKey(recipient)),
                  ],
                }))
              } else if (prop === 'directRelease') {
              } else if (prop === 'simpleRelease') {
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

function _getSwapId(encoded: string, initiator: string) {
  const packed = utils.solidityPack(['bytes32', 'address'], [encoded, initiator])
  return utils.keccak256(packed)
}

export function formatAddress(addr: string) {
  try {
    return new sol.PublicKey(addr).toString()
  } catch {
    return
  }
}
