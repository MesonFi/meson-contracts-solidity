import { BigNumber, utils } from 'ethers'
import sol from '@solana/web3.js'

export default class AptosAdaptor {
  readonly client: sol.Connection

  constructor(client: sol.Connection) {
    this.client = client
  }

  get nodeUrl() {
    return this.client.rpcEndpoint
  }

  async detectNetwork(): Promise<any> {
    // TODO
  }

  async getBlockNumber() {
    // TODO
    const info = await this.detectNetwork()
    return Number(info.block_height)
  }

  async getTransactionCount() {
    // TODO check
    return await this.client.getTransactionCount()
  }

  async getBalance(addr: string) {
    return BigNumber.from(await this.client.getBalance(new sol.PublicKey(addr)))
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
      return this.waitForTransaction(params[0])
    } else if (method === 'eth_getTransactionReceipt') {
      return this.waitForTransaction(params[0])
    }
  }

  async waitForTransaction(hash: string, confirmations?: number, timeout?: number) {
    const result = await this.client.getTransaction(hash, { commitment: 'finalized', maxSupportedTransactionVersion: 0 })
    return _wrapSolanaTx(result)
  }
}

function _wrapSolanaBlock(raw) {
  return {
    hash: '0x' + Number(raw.block_height).toString(16),
    parentHash: '0x' + Number(raw.block_height - 1).toString(16),
    number: raw.block_height,
    timestamp: Math.floor(raw.block_timestamp / 1000000).toString(),
    transactions: raw.transactions?.filter(tx => tx.type === 'user_transaction').map(_wrapSolanaTx) || []
  }
}

function _wrapSolanaTx(raw) {
  return raw
  return {
    blockHash: 'n/a',
    blockNumber: '',
    hash: utils.hexZeroPad(raw.hash, 32),
    from: utils.hexZeroPad(raw.sender, 32),
    to: utils.hexZeroPad(raw.payload?.function?.split('::')?.[0] || '0x', 32),
    value: '0',
    input: JSON.stringify(raw.payload),
    timestamp: Math.floor(raw.timestamp / 1000000).toString(),
    status: raw.success ? '0x1' : '0x0'
  }
}
