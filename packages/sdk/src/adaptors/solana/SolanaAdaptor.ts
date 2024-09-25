import { BigNumber, utils } from 'ethers'
import {
  Connection as SolConnection,
  PublicKey as SolPublicKey,
  type BlockResponse,
  type VersionedTransactionResponse,
  type CompiledInstruction,
  type MessageCompiledInstruction,
} from '@solana/web3.js'
import bs58 from 'bs58'

import { timer } from '../../utils'
import type { IAdaptor, WrappedTransaction } from '../types'

export default class SolanaAdaptor implements IAdaptor {
  #client: SolConnection | any

  constructor(client: SolConnection) {
    this.#client = client
  }

  get client() {
    return this.#client
  }

  protected set client(c) {
    this.#client = c
  }

  get nodeUrl() {
    return this.client.rpcEndpoint
  }

  async detectNetwork(): Promise<any> {
    return (await this.client.getLatestBlockhash('finalized')).blockhash
  }

  async getBlockNumber() {
    return (await this.client.getBlockHeight('finalized'))
  }

  async getGasPrice() {
    return BigNumber.from(0)
  }

  async getTransactionCount(addr: string) {
    return await this.client.getTransactionCount('finalized')
  }

  async getBalance(addr: string) {
    return BigNumber.from(await this.client.getBalance(new SolPublicKey(addr)))
  }

  async getCode(addr: string): Promise<string> {
    const accountInfo = await this.client.getAccountInfo(new SolPublicKey(addr))
    return accountInfo.executable ? '0x1' : '0x'
  }

  async getLogs(filter) {
    // TODO: fromBlock & toBlock
    const list = await this.client.getSignaturesForAddress(new SolPublicKey(filter.address), { limit: 200 })
    return list.map(raw => _wrapSolanaEvent(raw, filter.address)).reverse()
  }

  on () {}
  removeAllListeners () {}

  async send(method, params) {
    if (method === 'eth_getBlockByNumber') {
      if (params[0] === 'latest') {
        return
      } else {
        const number = parseInt(params[0])
        const block = await this.client.getBlock(number, params[1])
        return _wrapSolanaBlock(block)
      }
    } else if (method === 'eth_getBlockByHash') {
      if (params[0] === 'n/a') {
        return {}
      }
      const number = parseInt(params[0])
      const block = await this.client.getBlock(number, params[1])
      return _wrapSolanaBlock(block)
    } else if (method === 'eth_getTransactionByHash') {
      return this.#getTransaction(params[0])
    } else if (method === 'eth_getTransactionReceipt') {
      return this.#getTransaction(params[0], 1)
    }
  }

  async #getTransaction(hash: string, confirmations?: number) {
    const result = await this.client.getTransaction(hash, { maxSupportedTransactionVersion: 0, commitment: confirmations ? 'finalized' : 'confirmed' })
    return result && _wrapSolanaTx(result)
  }

  async waitForTransaction(hash: string, confirmations?: number, timeout?: number) {
    return new Promise<WrappedTransaction>((resolve, reject) => {
      const tryGetTransaction = async () => {
        try {
          const info = await this.#getTransaction(hash, confirmations)
          if (info) {
            clearInterval(h)
            resolve(info)
          }
        } catch {}
      }
      const h = setInterval(tryGetTransaction, 5000)
      tryGetTransaction()

      if (timeout) {
        timer(timeout * 1000).then(() => {
          clearInterval(h)
          reject(new Error('Time out'))
        })
      }
    })
  }
}

function _wrapSolanaEvent(raw, address) {
  const { slot, blockTime, err, signature } = raw
  return {
    blockNumber: slot,
    address,
    transactionHash: signature,
  }
}

function _wrapSolanaBlock(raw: BlockResponse) {
  return {
    hash: raw.parentSlot + 1,
    parentHash: raw.parentSlot,
    number: raw.parentSlot + 1,
    timestamp: raw.blockTime,
    transactions: raw.transactions?.map(tx => _wrapSolanaTx({ ...tx, slot: raw.parentSlot + 1, blockTime: raw.blockTime })) || []
  }
}

function _wrapSolanaTx(raw: VersionedTransactionResponse) {
  const {
    blockTime,
    slot,
    transaction: { signatures, message },
    meta: { err, logMessages, innerInstructions, loadedAddresses }
  } = raw
  const { recentBlockhash } = message
  const accountKeys = message.version === 'legacy'
    ? message.accountKeys
    : [...message.staticAccountKeys, ...loadedAddresses.writable, ...loadedAddresses.readonly]
  const instructions = message.version === 'legacy' ? message.instructions : message.compiledInstructions
  const signer = accountKeys.filter((_, i) => message.isAccountSigner(i))
  const parsed = instructions.map(ins => _parseInstruction(ins, accountKeys))
  const innerParsed = innerInstructions
    .map(inner => {
      const by = parsed[inner.index]?.programId
      return inner.instructions.map(ins => _parseInstruction(ins, accountKeys, by))
    })
    .flat()
  const allParsed = [...parsed, ...innerParsed]

  return {
    blockHash: 'n/a',
    blockNumber: slot,
    hash: signatures[0],
    from: signer.toString(),
    to: allParsed.map(parsed => parsed.programId),
    input: allParsed.map(parsed => parsed.data),
    value: '0',
    timestamp: blockTime,
    status: err ? '0x0' : '0x1'
  }
}

function _parseInstruction(ins: CompiledInstruction | MessageCompiledInstruction, keys: SolPublicKey[], by?: string) {
  const { data: _data, programIdIndex } = ins
  const data = utils.hexlify(typeof _data === 'string' ? bs58.decode(_data) : _data) + (by ? `@${by}` : '')
  const programId = keys[programIdIndex]?.toString()
  if (!programId) {
    return
  }
  return { programId, data, accounts: ins['accounts'] || ins['accountKeyIndexes'] }
}
