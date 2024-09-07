import fetch from 'cross-fetch'
import * as btclib from 'bitcoinjs-lib'
import { BigNumber } from 'ethers'
import { timer } from '../../utils'

export default class BtcAdaptor {
  readonly isTestnet: boolean
  readonly network: any
  readonly url: string
  readonly mesonAddress: string

  constructor(urlOrAdaptor: string | BtcAdaptor, isTestnet?: boolean, mesonAddress?: string) {
    this.isTestnet = Boolean(isTestnet)
    this.network = isTestnet ? btclib.networks.testnet : btclib.networks.bitcoin
    this.url = urlOrAdaptor instanceof BtcAdaptor ? urlOrAdaptor.url : urlOrAdaptor
    this.mesonAddress = mesonAddress
  }

  get nodeUrl() {
    return this.url
  }

  async detectNetwork(): Promise<any> {
    const response = await fetch(`${this.url}/v1/lightning/statistics/latest`)
    const data = await response.json()
    return data
  }

  async getBlockNumber() {
    const response = await fetch(`${this.url}/blocks/tip/height`)
    const height = await response.json()
    return height
  }

  async getBalance(addr: string) {
    const response = await fetch(`${this.url}/address/${addr}`)
    const data = await response.json()
    const balance = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum
    return balance
  }

  async getCode(addr) {
    return
  }

  async getLogs(filter) {
    const response = await fetch(`${this.url}/address/${filter.address}/txs`)
    const txs = await response.json()
    return txs.map(raw => _wrapBtcEvent(raw, filter.address))
  }

  on() { }
  removeAllListeners() { }

  async send(method, params) {
    if (method === 'eth_getTransactionByHash') {
      return _wrapBtcTx(await this._getTransaction(params[0]), this.mesonAddress)
    } else if (method === 'eth_getTransactionReceipt') {
      return _wrapBtcTx(await this._getTransaction(params[0]), this.mesonAddress)
    }

    if (method === 'eth_getBlockByNumber') {
      if (params[0] === 'latest') {
        const hash = await this._getTipHash()
        const block = await this._getBlock(hash)
        const txs = params[1] && await this._getBlockTxs(hash)
        return _wrapBtcBlock(block, txs, this.mesonAddress)
      }
      const hash = await this._getBlockHashByHeight(params[0])
      const block = await this._getBlock(hash)
      const txs = params[1] && await this._getBlockTxs(hash)
      return _wrapBtcBlock(block, txs, this.mesonAddress)
    } else if (method === 'eth_getBlockByHash') {
      if (params[0] === 'n/a') {
        return {}
      }
      const block = await this._getBlock(params[0])
      const txs = params[1] && await this._getBlockTxs(params[0])
      return _wrapBtcBlock(block, txs, this.mesonAddress)
    }
  }

  async _getTipHash() {
    const response = await fetch(`${this.url}/blocks/tip/hash`)
    const hash = await response.json()
    return hash
  }

  async _getBlockHashByHeight(height: number) {
    const response = await fetch(`${this.url}/block-height/${height}`)
    const hash = await response.json()
    return hash
  }

  async _getBlock(hash: string) {
    const response = await fetch(`${this.url}/block/${hash}`)
    const header = await response.json()
    return header
  }

  async _getBlockTxs(hash: string) {
    const response = await fetch(`${this.url}/block/${hash}/txs`)
    const txs = await response.json()
    return txs
  }

  async _getTransaction(hash: string) {
    const response = await fetch(`${this.url}/tx/${hash}`)
    const info = await response.json()
    return info
  }

  async waitForTransaction(hash: string, confirmations?: number, timeout?: number) {
    return new Promise((resolve, reject) => {
      const tryGetTransaction = async () => {
        const info = await this._getTransaction(hash)
        if (info.status.confirmed) {
          clearInterval(h)
          resolve(_wrapBtcTx(info, this.mesonAddress))
        }
      }
      const h = setInterval(tryGetTransaction, 3000)
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
    blockHash: block.block_hash,
    blockNumber: block.block_height,
    hash: raw.txid,
    status: block.confirmed ? '1' : '0',
    to: matched.map(v => v.scriptpubkey_address),
    input: matched.map(v => v.value),
    value: '0',
    timestamp: block.block_time.toString(),
  }
}
