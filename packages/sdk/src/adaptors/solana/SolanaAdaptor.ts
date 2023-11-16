import { BigNumber, utils } from 'ethers'
import {
  Connection as SolConnection,
  PublicKey as SolPublicKey,
  BlockResponse,
  TransactionResponse,
} from '@solana/web3.js'
import bs58 from 'bs58'
import { timer } from '../../utils'

export default class AptosAdaptor {
  readonly client: SolConnection

  constructor(client: SolConnection) {
    this.client = client
  }

  get nodeUrl() {
    return this.client.rpcEndpoint
  }

  async detectNetwork(): Promise<any> {
    return (await this.client.getLatestBlockhash('finalized')).blockhash
  }

  async getBlockNumber() {
    return (await this.client.getBlockHeight('confirmed'))
  }

  async getTransactionCount() {
    return await this.client.getTransactionCount('finalized')
  }

  async getBalance(addr: string) {
    return BigNumber.from(await this.client.getBalance(new SolPublicKey(addr)))
  }

  async getCode(addr) {
    // TODO
    return
  }

  on () {}
  removeAllListeners () {}

  async send(method, params) {
    if (method === 'eth_getBlockByNumber') {
      if (params[0] === 'latest') {
        const number = await this.getBlockNumber()
        const block = await this.client.getBlock(number)
        return _wrapSolanaBlock(block)
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
      return this._getTransaction(params[0])
    } else if (method === 'eth_getTransactionReceipt') {
      return this._getTransaction(params[0], 1)
    }
  }

  async _getTransaction(hash: string, confirmations?: number) {
    const result = await this.client.getTransaction(hash, { commitment: confirmations ? 'finalized' : 'confirmed' })
    return result && _wrapSolanaTx(result)
  }

  async waitForTransaction(hash: string, confirmations?: number, timeout?: number) {
    return new Promise((resolve, reject) => {
      const h = setInterval(async () => {
        try {
          const info = await this._getTransaction(hash, confirmations)
          if (info) {
            clearInterval(h)
            resolve(info)
          }
        } catch {}
      }, 1000)

      if (timeout) {
        timer(timeout * 1000).then(() => {
          clearInterval(h)
          reject(new Error('Time out'))
        })
      }
    })
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

function _wrapSolanaTx(raw: TransactionResponse) {
  const {
    blockTime,
    slot,
    transaction: { signatures, message },
    meta: { err, logMessages }
  } = raw
  const { recentBlockhash, instructions, accountKeys } = message

  const signer = accountKeys.filter((_, i) => message.isAccountSigner(i))

  const programs = Array.from((<any>message).indexToProgramIds.entries())
    .filter(([_, programId]) => programId.toString() !== 'ComputeBudget111111111111111111111111111111')
  const indices = programs.map(p => p[0])
  const ins = instructions.filter(ins => indices.includes(ins.programIdIndex))

  if (!ins.length) {
    return
  }
  const { accounts, data, programIdIndex } = ins[0]
  const programId = programs.find(p => p[0] === programIdIndex)[1]

  return {
    blockHash: 'n/a',
    blockNumber: slot,
    hash: signatures[0],
    from: signer.toString(),
    to: programId.toString(),
    value: '0',
    input: utils.hexlify(bs58.decode(data)),
    timestamp: blockTime,
    status: err ? '0x0' : '0x1'
  }
}
