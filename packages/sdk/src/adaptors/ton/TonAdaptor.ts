import { BigNumber } from 'ethers'
import { Address } from '@ton/core'
import { TonClient } from '@ton/ton'
import { HttpClient, Api as TonApi, Trace } from 'tonapi-sdk-js'

import { timer } from '../../utils'
import type { IAdaptor, WrappedTransaction } from '../types'

export default class TonAdaptor implements IAdaptor {
  #client: TonClient | any
  #tonApi: TonApi<HttpClient>

  constructor(client: TonClient) {
    this.#client = client
    this.#tonApi = new TonApi(new HttpClient({
      baseUrl: (<any>client).metadata.url_tonconsole,
      baseApiParams: {
        headers: {
          Authorization: `Bearer ${process.env.TON_CONSOLE_API}`,
          'Content-type': 'application/json'
        }
      }
    }))
  }

  get client() {
    return this.#client
  }

  get nodeUrl() {
    return this.client.parameters.endpoint
  }

  async detectNetwork(): Promise<any> {
    return (await this.client.getMasterchainInfo()).latestSeqno != 0
  }

  async getBlockNumber() {
    return (await this.client.getMasterchainInfo()).latestSeqno
  }

  async getGasPrice() {
    return BigNumber.from(0)    // TODO
  }

  async getBalance(addr: string) {
    const tonAddr = Address.parse(addr)
    return BigNumber.from(await this.client.getBalance(tonAddr))
  }

  async getCode(addr) {
    return ''   // TODO
  }

  async getLogs(filter) {
  }

  on() { }
  removeAllListeners() { }

  async #getTransaction(hash: string) {
    return await this.#tonApi.traces.getTrace(hash)
  }

  async send(method, params) {
    if (method === 'eth_getTransactionByHash') {
      return this._wrapTonTx(await this.#getTransaction(params[0]))
    } else if (method === 'eth_getTransactionReceipt') {
      return this._wrapTonTx(await this.#getTransaction(params[0]))
    }

    if (method === 'eth_getBlockByNumber') {
      if (params[0] === 'latest') {
        // return _wrapTronBlock(await this.client.trx.getCurrentBlock())
      } else {
        console.warn(`TonAdaptor: 'eth_getBlockByNumber' unsupported`)
        return
      }
    } else if (method === 'eth_getBlockByHash') {
      // return _wrapTronBlock(await this.client.trx.getBlockByHash(params[0]))
    }
    throw new Error(`TonAdaptor: '${method}' unsupported`)
  }

  async waitForTransaction(hash: string, confirmations?: number, timeout?: number): Promise<WrappedTransaction> {
    return new Promise((resolve, reject) => {
      const tryGetTransaction = async () => {
        let info: Trace
        try {
          info = await this.#getTransaction(hash)
        } catch {}
        if (Object.keys(info || {}).length) {
          clearInterval(h)
          resolve(this._wrapTonTx(info))
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

  protected _wrapTonTx(tx: Trace) {
    const { transaction } = tx
    const parsed = transaction.in_msg.decoded_body?.actions.map(a => {
      switch (a.msg.sum_type) {
        case 'MessageInternal': {
          const data = a.msg.message_internal.body.value
          if (data.sum_type === 'JettonTransfer') {
            return {
              value: data.value.amount,
              to: Address.parseRaw(data.value.destination).toString({ bounceable: false }),
            }
          }
          return
        }
        default:
          console.log(a)
          return
      }
    })
    return {
      blockHash: 'n/a',
      blockNumber: '',
      block: Number(transaction.block.split(',')[2].replace(')', '')), // (0,e000000000000000,46178664)
      hash: transaction.hash,
      from: Address.parseRaw(transaction.account.address).toString({ bounceable: false }),
      to: parsed.map(v => v.to),
      input: parsed.map(v => v.value),
      timestamp: transaction.utime.toString(),
      status: transaction.success ? '0x1' : '0x0',
    }
  }
}
