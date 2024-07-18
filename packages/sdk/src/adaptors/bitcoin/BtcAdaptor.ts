import fetch from 'cross-fetch'
import * as bitcoin from 'bitcoinjs-lib'
import { BigNumber } from 'ethers'
import { timer } from '../../utils'

export default class BtcAdaptor {
  readonly isTestnet: boolean
  readonly network: any
  readonly url: string

  constructor(urlOrAdaptor: string | BtcAdaptor, isTestnet?: boolean) {
    this.isTestnet = Boolean(isTestnet)
    this.network = isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    this.url = urlOrAdaptor instanceof BtcAdaptor ? urlOrAdaptor.url : urlOrAdaptor
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
  }

  on() { }
  removeAllListeners() { }

  async send(method, params) {
  }

  async waitForTransaction(hash: string, confirmations?: number, timeout?: number) {
    return new Promise((resolve, reject) => {
      const tryGetTransaction = async () => {
        const response = await fetch(`${this.url}/tx/${hash}`)
        const info = await response.json()
        if (info.status.confirmed) {
          clearInterval(h)
          resolve(_wrapBtcReceipt(info))
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

function _wrapBtcBlock(raw) {
  return {
    hash: raw.blockID,
    parentHash: raw.block_header.raw_data.parentHash,
    number: raw.block_header.raw_data.number,
    timestamp: Math.floor(raw.block_header.raw_data.timestamp / 1000).toString(),
    transactions: raw.transactions?.map(_wrapBtcTx) || []
  }
}

function _wrapBtcEvent(raw) {
  const { block, timestamp, contract, name, transaction } = raw
  return {
    blockNumber: block,
    address: contract,
    name,
    transactionHash: transaction,
  }
}

function _wrapBtcTx(raw) {
  const {
    ref_block_hash: blockHash,
    timestamp,
  } = raw.raw_data || {}
  const {
    owner_address: from, // hex
    contract_address: to, // hex
    data,
  } = raw.raw_data?.contract[0]?.parameter?.value || {}

  return {
    blockHash: '',
    blockNumber: '',
    hash: raw.txID,
    // from: TronWeb.address.fromHex(from),
    // to: TronWeb.address.fromHex(to),
    value: '0',
    input: `0x${data}`,
    timestamp: Math.floor(timestamp / 1000).toString(),
    ...raw,
  }
}

function _wrapBtcReceipt(raw) {
  return {
    status: raw.status.confirmed === true ? '1' : '0',
    blockNumber: raw.status.block_height,
    timestamp: raw.status.block_time,
    // logs: raw.log?.map(log => ({
    //   // address: TronWeb.address.fromHex(`0x${log.address}`),
    //   topics: log.topics.map(topic => `0x${topic}`),
    //   data: `0x${log.data || ''}`
    // })),
  }
}
