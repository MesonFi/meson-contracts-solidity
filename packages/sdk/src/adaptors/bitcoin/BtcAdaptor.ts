import fetch from 'cross-fetch'
import { BigNumber } from 'ethers'
import * as btclib from 'bitcoinjs-lib'

import { timer } from '../../utils'
import type { IAdaptor, WrappedTransaction } from '../types'
import type BtcClient from './BtcClient'

export default class BtcAdaptor implements IAdaptor {
  #client: BtcClient | any

  constructor(client: BtcClient) {
    this.#client = client
  }

  get client() {
    return this.#client
  }

  protected set client(c) {
    this.#client = c
  }

  get nodeUrl() {
    return this.client.url
  }

  get isTestnet() {
    return this.client.isTestnet
  }

  get network() {
    return this.isTestnet ? btclib.networks.testnet : btclib.networks.bitcoin
  }

  get mesonAddress() {
    return this.client.mesonAddress
  }

  async detectNetwork(): Promise<any> {
    const response = await fetch(`${this.nodeUrl}/v1/lightning/statistics/latest`)
    const data = await response.json()
    return data != null && data != undefined
  }

  async getBlockNumber() {
    const response = await fetch(`${this.nodeUrl}/blocks/tip/height`)
    const height = await response.json()
    return height
  }

  async getGasPrice() {
    return BigNumber.from(0)
  }

  async getTransactionCount(addr: string) {
  }

  async getBalance(addr: string) {
    const response = await fetch(`${this.nodeUrl}/address/${addr}`)
    const data = await response.json()
    return BigNumber.from(data.chain_stats.funded_txo_sum).sub(data.chain_stats.spent_txo_sum)
  }

  async getCode(addr: string): Promise<string> {
    // TODO
    return ''
  }

  async getLogs(filter) {
    const response = await fetch(`${this.nodeUrl}/address/${filter.address}/txs`)
    const txs = await response.json()
    return txs.map(raw => _wrapBtcEvent(raw, filter.address))
  }

  on() { }
  removeAllListeners() { }

  async send(method, params) {
    if (method === 'eth_getTransactionByHash') {
      return _wrapBtcTx(await this.#getTransaction(params[0]), this.mesonAddress)
    } else if (method === 'eth_getTransactionReceipt') {
      return _wrapBtcTx(await this.#getTransaction(params[0]), this.mesonAddress)
    }

    if (method === 'eth_getBlockByNumber') {
      if (params[0] === 'latest') {
        const hash = await this.#getTipHash()
        const block = await this.#getBlock(hash)
        const txs = params[1] && await this.#getBlockTxs(hash)
        return _wrapBtcBlock(block, txs, this.mesonAddress)
      }
      const hash = await this.#getBlockHashByHeight(params[0])
      const block = await this.#getBlock(hash)
      const txs = params[1] && await this.#getBlockTxs(hash)
      return _wrapBtcBlock(block, txs, this.mesonAddress)
    } else if (method === 'eth_getBlockByHash') {
      if (params[0] === 'n/a') {
        return {}
      }
      const block = await this.#getBlock(params[0])
      const txs = params[1] && await this.#getBlockTxs(params[0])
      return _wrapBtcBlock(block, txs, this.mesonAddress)
    }
  }

  async #getTipHash() {
    const response = await fetch(`${this.nodeUrl}/blocks/tip/hash`)
    const hash = await response.json()
    return hash
  }

  async #getBlockHashByHeight(height: number) {
    const response = await fetch(`${this.nodeUrl}/block-height/${height}`)
    const hash = await response.json()
    return hash
  }

  async #getBlock(hash: string) {
    const response = await fetch(`${this.nodeUrl}/block/${hash}`)
    const header = await response.json()
    return header
  }

  async #getBlockTxs(hash: string) {
    const response = await fetch(`${this.nodeUrl}/block/${hash}/txs`)
    const txs = await response.json()
    return txs
  }

  async #getTransaction(hash: string) {
    const response = await fetch(`${this.nodeUrl}/tx/${hash}`)
    const info = await response.json()
    return info
  }

  protected async _getFeeRate() {
    const response = await fetch(`${this.nodeUrl}/v1/fees/recommended`)
    const data = await response.json()
    return data
  }

  async waitForTransaction(hash: string, confirmations?: number, timeout?: number) {
    return new Promise<WrappedTransaction>((resolve, reject) => {
      const tryGetTransaction = async () => {
        const info = await this.#getTransaction(hash)
        const height = await this.getBlockNumber()
        if (info.status.confirmed && height - info.status.block_height + 1 >= (confirmations || 1)) {
          clearInterval(h)
          resolve(_wrapBtcTx(info, this.mesonAddress))
        }
      }
      const h = setInterval(tryGetTransaction, 10_000)
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

function _wrapBtcBlock(block: any, txs: any[], mesonAddress: string) {
  return {
    hash: block.id,
    parentHash: block.previousblockhash,
    number: block.height,
    timestamp: block.timestamp.toString(),
    transactions: txs?.map(tx => _wrapBtcTx(tx, mesonAddress)) || []
  }
}

function _wrapBtcEvent(raw, address) {
  const { status: block } = raw
  return {
    blockNumber: block.block_height,
    address,
    transactionHash: raw.txid,
  }
}

function _wrapBtcTx(raw, mesonAddress) {
  const { status: block } = raw || {}
  const matched = raw.vout.filter(v => v.scriptpubkey_address === mesonAddress)
  return {
    blockHash: block.block_hash as string,
    blockNumber: block.block_height,
    hash: raw.txid,
    status: block.confirmed ? '1' : '0',
    to: matched.map(v => v.scriptpubkey_address),
    input: matched.map(v => v.value),
    value: '0',
    timestamp: block.block_time.toString(),
  }
}
