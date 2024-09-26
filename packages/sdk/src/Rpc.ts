import { IAdaptor } from './adaptors/types'

export type Block = {
  hash: string
  parentHash: string
  number: string
  timestamp: string
  transactions: Transaction[]
  uncles?: string[]
}

export type Transaction = {
  hash: string
  from: string
  to: string
  value: string
  input: string
  blockHash?: string
  blockNumber: string
  timestamp: string
}

export type Receipt = {
  status: string
  blockNumber: string
  [key: string]: any
}

export class Rpc {
  #provider: IAdaptor

  constructor(provider: IAdaptor) {
    this.#provider = provider
  }

  async getLatestBlock(): Promise<Block> {
    return await this.#provider.send('eth_getBlockByNumber', ['latest', true])
  }

  async getBlockByNumber(blockNumber: number, withTransactions: boolean = false): Promise<Block> {
    const hexBlockNumber = `0x${blockNumber.toString(16)}`
    return await this.#provider.send('eth_getBlockByNumber', [hexBlockNumber, withTransactions])
  }

  async getBlockByHash(blockHash: string, withTransactions: boolean = false): Promise<Block> {
    return await this.#provider.send('eth_getBlockByHash', [blockHash, withTransactions])
  }

  async getTransaction(hash: string): Promise<Transaction> {
    return await this.#provider.send('eth_getTransactionByHash', [hash])
  }

  async getReceipt(hash: string): Promise<Receipt> {
    return await this.#provider.send('eth_getTransactionReceipt', [hash])
  }
}
