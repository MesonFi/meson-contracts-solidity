import { BigNumber } from 'ethers'
import { TonClient } from '@ton/ton'
import { Address } from '@ton/core'
import { HttpClient, Api as TonConsoleClient, Trace } from 'tonapi-sdk-js'

import { timer } from '../../utils'
import type { IAdaptor, WrappedTransaction } from '../types'

export default class TonAdaptor implements IAdaptor {
  #client: TonClient | any
  #clientTonConsole: TonConsoleClient<HttpClient>

  constructor(client: TonClient) {
    this.#client = client
    this.#clientTonConsole = new TonConsoleClient(new HttpClient({
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

  async send(method, params) {
  }

  async waitForTransaction(hash: string, confirmations?: number, timeout?: number): Promise<WrappedTransaction> {
    return new Promise((resolve, reject) => {
      const tryGetTransaction = async () => {
        let info: Trace
        try {
          info = await this.#clientTonConsole.traces.getTrace(hash)
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

  async waitForCompletion(submitTs: number, sender: string | Address, timeout?: number) {
    const tonAddr = typeof sender === 'string' ? Address.parse(sender) : sender
    return new Promise((resolve, reject) => {
      const tryGetTransaction = async () => {
        const tx = (await this.client.getTransactions(tonAddr, { limit: 1 }))[0]
        if (tx.now >= submitTs) {
          clearInterval(h)
          resolve(this._wrapTonTx(tx))
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

  protected _wrapTonTx(tx: Trace) {
    return {
      from: Address.parseRaw(tx.transaction.account.address),
      to: Address.parseRaw(tx.children[0].transaction.account.address),
      hash: tx.transaction.hash,
      timestamp: tx.transaction.utime,
      block: parseInt(tx.transaction.block   // format: '(0,e000000000000000,46178664)'
        .split(',')[2].replace(')', '')),
      blockHash: 'n/a',
      status: '0x1',
    }
  }
}
