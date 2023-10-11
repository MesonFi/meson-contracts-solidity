import { BigNumber } from 'ethers'
import TronWeb from 'tronweb'
import { timer } from '../../utils'

export default class TronAdaptor {
  readonly client

  constructor(client) {
    this.client = client
  }

  get nodeUrl() {
    return this.client.fullNode.host
  }

  async detectNetwork(): Promise<any> {
    return this.client.fullNode.isConnected()
  }

  async getBlockNumber() {
    const latestBlock = await this.client.trx.getCurrentBlock()
    return latestBlock?.block_header?.raw_data?.number
  }

  async getBalance(addr) {
    return BigNumber.from(await this.client.trx.getBalance(addr))
  }

  async getCode(addr) {
    const account = await this.client.trx.getAccount(addr)
    return account.type === 'Contract' ? '0x1' : '0x'
  }

  on () {}
  removeAllListeners () {}

  async send(method, params) {
    if (method === 'eth_getBlockByNumber') {
      if (params[0] === 'latest') {
        return _wrapTronBlock(await this.client.trx.getCurrentBlock())
      } else {
        console.warn(`TronAdaptor: 'eth_getBlockByNumber' unsupported`)
        return
      }
    } else if (method === 'eth_getBlockByHash') {
      return _wrapTronBlock(await this.client.trx.getBlockByHash(params[0]))
    } else if (method === 'eth_getTransactionByHash') {
      return _wrapTronTx(await this.client.trx.getTransaction(params[0]))
    } else if (method === 'eth_getTransactionReceipt') {
      return _wrapTronReceipt(await this.client.trx.getUnconfirmedTransactionInfo(params[0]))
    }
    throw new Error(`TronAdaptor: '${method}' unsupported`)
  }

  async waitForTransaction(hash: string, confirmations?: number, timeout?: number) {
    return new Promise((resolve, reject) => {
      const h = setInterval(async () => {
        let info
        try {
          if (confirmations > 1) {
            info = await this.client.trx.getTransactionInfo(hash)
          } else {
            info = await this.client.trx.getUnconfirmedTransactionInfo(hash)
          }
        } catch {}
        if (Object.keys(info).length) {
          clearInterval(h)
          resolve(_wrapTronReceipt(info))
        }
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

function _wrapTronBlock(raw) {
  return {
    hash: raw.blockID,
    parentHash: raw.block_header.raw_data.parentHash,
    number: raw.block_header.raw_data.number,
    timestamp: Math.floor(raw.block_header.raw_data.timestamp / 1000).toString(),
    transactions: raw.transactions?.map(_wrapTronTx) || []
  }
}

function _wrapTronTx(raw) {
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
    from: TronWeb.address.fromHex(from),
    to: TronWeb.address.fromHex(to),
    value: '0',
    input: `0x${data}`,
    timestamp: Math.floor(timestamp / 1000).toString(),
    ...raw,
  }
}

function _wrapTronReceipt(raw) {
  return {
    status: raw.receipt?.result === 'SUCCESS' ? '1' : '0',
    blockNumber: raw.blockNumber,
    timestamp: Math.floor(raw.blockTimeStamp / 1000).toString()
  }
}
