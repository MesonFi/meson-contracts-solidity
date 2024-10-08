import { TonClient } from '@ton/ton'
import { Address, CommonMessageInfoInternal, Transaction } from '@ton/core'
import { BigNumber } from 'ethers'

import { timer } from '../../utils'
import type { IAdaptor, WrappedTransaction } from '../types'

export default class TonAdaptor implements IAdaptor {
  #client: TonClient | any

  constructor(client: TonClient) {
    this.#client = client
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
      resolve({ blockHash: '', status: 'success' })
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

  _wrapTonTx(tx: Transaction) {
    return {
      from: tx.outMessages.get(0).info.src,
      to: tx.outMessages.get(0).info.dest,
      hash: tx.hash().toString('hex'),
      value: (tx.outMessages.get(0).info as CommonMessageInfoInternal).value.coins,
      input: tx.inMessage.body,
      timestamp: tx.now,
    }
  }
}
