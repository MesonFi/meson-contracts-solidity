import { TonClient } from '@ton/ton'
import { Address } from '@ton/core'

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

  //   async waitForTransaction(hash: string, confirmations?: number, timeout?: number) {
  //     return new Promise((resolve, reject) => {
  //       const tryGetTransaction = async () => {
  //         let info
  //         try {
  //           if (confirmations) {
  //             // info = await this.client.trx.getTransactionInfo(hash)
  //           } else {
  //             // info = await this.client.trx.getUnconfirmedTransactionInfo(hash)
  //           }
  //         } catch {}
  //         if (Object.keys(info || {}).length) {
  //           clearInterval(h)
  //           resolve(_wrapBtcReceipt(info))
  //         }
  //       }
  //       const h = setInterval(tryGetTransaction, 3000)
  //       tryGetTransaction()

  //       if (timeout) {
  //         timer(timeout * 1000).then(() => {
  //           clearInterval(h)
  //           reject(new Error('Time out'))
  //         })
  //       }
  //     })
  //   }
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

// function _wrapBtcTx(raw) {
//   const {
//     ref_block_hash: blockHash,
//     timestamp,
//   } = raw.raw_data || {}
//   const {
//     owner_address: from, // hex
//     contract_address: to, // hex
//     data,
//   } = raw.raw_data?.contract[0]?.parameter?.value || {}

//   return {
//     blockHash: '',
//     blockNumber: '',
//     hash: raw.txID,
//     // from: TronWeb.address.fromHex(from),
//     // to: TronWeb.address.fromHex(to),
//     value: '0',
//     input: `0x${data}`,
//     timestamp: Math.floor(timestamp / 1000).toString(),
//     ...raw,
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