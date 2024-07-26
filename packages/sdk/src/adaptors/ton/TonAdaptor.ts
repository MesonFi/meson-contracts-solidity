import { TonClient } from '@ton/ton'
import { Address, CommonMessageInfoInternal, Transaction } from '@ton/core'
import { timer } from '../../utils'

export default class TonAdaptor {
  readonly url: string
  readonly client: TonClient

  constructor(urlOrAdaptor: string | TonAdaptor) {
    this.url = urlOrAdaptor instanceof TonAdaptor ? urlOrAdaptor.url : urlOrAdaptor
    this.client = new TonClient({ endpoint: this.url, apiKey: process.env.TON_TESTNET_API_KEY })
  }

  get nodeUrl() {
    return this.url
  }

  async detectNetwork(): Promise<any> {
    return (await this.client.getMasterchainInfo()).latestSeqno != 0
  }

  async getBlockNumber() {
    return (await this.client.getMasterchainInfo()).latestSeqno
  }

  async getBalance(addr: string | Address) {
    const tonAddr = typeof addr === 'string' ? Address.parse(addr) : addr
    return (await this.client.getBalance(tonAddr)).toString()
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

  async waitForCompletion(submitTs: number, sender: string | Address, timeout?: number) {
    const tonAddr = typeof sender === 'string' ? Address.parse(sender) : sender
    return new Promise((resolve, reject ) => {
      const tryGetTransaction = async () => {
        console.log("   waiting for tx completed on-chain...")
        const tx = (await this.client.getTransactions(tonAddr, { limit: 1 }))[0]
        if (tx.now >= submitTs) {
          clearInterval(h)
          resolve(_wrapTonTx(tx))
        }
      }
      const h = setInterval(tryGetTransaction, 5000)
      tryGetTransaction()

      if (timeout) 
        timer(timeout * 1000).then(() => {
          clearInterval(h)
          reject(new Error('Time out'))
      })
    })
  }
}

function _wrapTonTx(tx: Transaction) {
  return {
    from: tx.inMessage.info.src,
    to: Address.parseRaw('0:' + tx.address.toString(16)),
    hash: tx.hash().toString('hex'),
    value: (tx.inMessage.info as CommonMessageInfoInternal).value.coins,
    input: tx.inMessage.body,
    timestamp: tx.now,
  }
}

// function _wrapBtcBlock(raw) {
//   return {
//     hash: raw.blockID,
//     parentHash: raw.block_header.raw_data.parentHash,
//     number: raw.block_header.raw_data.number,
//     timestamp: Math.floor(raw.block_header.raw_data.timestamp / 1000).toString(),
//     transactions: raw.transactions?.map(_wrapBtcTx) || []
//   }
// }

// function _wrapBtcEvent(raw) {
//   const { block, timestamp, contract, name, transaction } = raw
//   return {
//     blockNumber: block,
//     address: contract,
//     name,
//     transactionHash: transaction,
//   }
// }

// function _wrapBtcReceipt(raw) {
//   return {
//     status: raw.receipt?.result === 'SUCCESS' ? '1' : '0',
//     blockNumber: raw.blockNumber,
//     timestamp: Math.floor(raw.blockTimeStamp / 1000).toString(),
//     logs: raw.log?.map(log => ({
//         // address: TronWeb.address.fromHex(`0x${log.address}`),
//         topics: log.topics.map(topic => `0x${topic}`),
//         data: `0x${log.data || ''}`
//     })),
//   }
// }