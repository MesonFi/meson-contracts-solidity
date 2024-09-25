import { BigNumber, type providers } from 'ethers'
import {
  RPC as CkbRPC,
  Indexer,
  helpers,
  config,
} from '@ckb-lumos/lumos'

import { timer } from '../../utils'
import type { IAdaptor, WrappedTransaction } from '../types'

const JOYID_CODE_HASH = {
  TESTNET: '0xd23761b364210735c19c60561d213fb3beae2fd6172743719eff6920e020baac',
  MAINNET: '0xd00c84f0ec8fd441c38bc3f87a371f547190f2fcff88e642bc5bf54b9e318323',
}

export default class CkbAdaptor implements IAdaptor {
  #client: CkbRPC | any

  readonly network: typeof config.TESTNET
  readonly joyidCodeHash: string
  readonly indexer: Indexer

  constructor(client: CkbRPC) {
    const isTestnet = client.node.url.includes('testnet')
    this.network = isTestnet ? config.TESTNET : config.MAINNET
    this.joyidCodeHash = isTestnet ? JOYID_CODE_HASH.TESTNET : JOYID_CODE_HASH.MAINNET
    this.#client = client
    const indexerUrl = isTestnet ? 'https://testnet.ckb.dev/indexer' : 'https://mainnet.ckb.dev/indexer'
    this.indexer = new Indexer(indexerUrl, client.node.url)
  }

  get client() {
    return this.#client
  }

  protected set client(c) {
    this.#client = c
  }

  get nodeUrl() {
    return this.#client.node.url
  }

  protected _prefixFromCodeHash(codeHash: string) {
    switch (codeHash) {
      case this.network.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH:
        return '0x000000'
      case this.joyidCodeHash:
        return '0x01'
      default:
        throw new Error('Unsupported codeHash')
    }
  }

  addressFromPkh(pkh: string = '') {
    switch (pkh.substring(0, 4)) {
      case '0x00':
        return helpers.encodeToAddress({
          codeHash: this.network.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
          hashType: this.network.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
          args: '0x' + pkh.substring(8),
        }, { config: this.network })
      case '0x01':
        return helpers.encodeToAddress({
          codeHash: this.joyidCodeHash,
          hashType: 'type',
          args: '0x' + pkh.substring(4),
        }, { config: this.network })
      default:
        throw new Error('Unsupported publick key hash')
    }
  }

  async detectNetwork(): Promise<any> {
    return await this.client.getBlockchainInfo()
  }

  async getBlockNumber() {
    const result = await this.client.getTipBlockNumber()
    return Number(result)
  }

  async getGasPrice() {
    return BigNumber.from(0)
  }

  async getTransactionCount(addr: string) {
  }

  async getBalance(addr: string) {
    const collector = this.indexer.collector({
      lock: helpers.parseAddress(addr, { config: this.network })
    })
    let balance = BigNumber.from(0)
    for await (const cell of collector.collect()) {
      balance = balance.add(cell.cellOutput.capacity)
    }
    return balance
  }

  async getCode(addr: string): Promise<string> {
    // TODO
    return ''
  }

  async getLogs(filter: providers.Filter) {
  }

  on () {}
  removeAllListeners () {}

  async send(method, params) {
    if (method === 'eth_getTransactionByHash') {
      return _wrapCkbTx(await this.client.getTransaction(params[0]))
    } else if (method === 'eth_getTransactionReceipt') {
      return _wrapCkbTx(await this.client.getTransaction(params[0], '0x2', true))
    }

    if (method === 'eth_getBlockByNumber') {
      if (params[0] === 'latest') {
        const header = await this.client.getTipHeader()
        if (params[1]) {
          return _wrapCkbBlock(await this.client.getBlock(header.hash))
        }
        return _wrapCkbBlock({ header })
      }
      if (params[1]) {
        return _wrapCkbBlock(await this.client.getBlockByNumber(params[0]))
      } else {
        return _wrapCkbBlock({ header: await this.client.getHeaderByNumber(params[0]) })
      }
    } else if (method === 'eth_getBlockByHash') {
      if (params[0] === 'n/a') {
        return {}
      }
      if (params[1]) {
        return _wrapCkbBlock(await this.client.getBlock(params[0]))
      } else {
        return _wrapCkbBlock({ header: await this.client.getHeader(params[0]) })
      }
    }
  }

  async waitForTransaction(hash: string, confirmations?: number, timeout?: number) {
    return new Promise<WrappedTransaction>((resolve, reject) => {
      const tryGetTransaction = async () => {
        try {
          const receipt = await this.client.getTransaction(hash, '0x2', true)
          if (receipt) {
            clearInterval(h)
            resolve(_wrapCkbTx(receipt))
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

function _wrapCkbEvent(raw) {
  return raw
}

function _wrapCkbBlock(raw) {
  const { header, transactions = [], uncles } = raw
  return {
    hash: header.hash,
    parentHash: header.parentHash,
    number: Number(header.number),
    timestamp: Math.floor(header.timestamp / 1000).toString(),
    transactions: transactions.map(transaction => _wrapCkbTx({ transaction, txStatus: { blockHash: header.hash } })).filter(Boolean)
  }
}

function _wrapCkbTx(raw) {
  const { txStatus, transaction } = raw
  return {
    blockHash: txStatus.blockHash,
    hash: transaction.hash,
    to: transaction.outputs.map(o => o.lock.codeHash),
    input: transaction.outputs.map(o => o.lock.args),
    value: '0',
    status: txStatus.status === 'committed' ? '0x1' : '0x0',
    extra: {
      inputs: transaction.inputs.map(i => i.previousOutput),
      deps: transaction.cellDeps.filter(d => d.depType === 'code').map(d => d.outPoint),
      witnesses: transaction.witnesses,
    }
  }
}
