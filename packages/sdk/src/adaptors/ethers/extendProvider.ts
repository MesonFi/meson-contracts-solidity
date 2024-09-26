import { providers, errors } from 'ethers'

import type { IAdaptor, WrappedTransaction } from '../types'

export type ProviderConstructor = new (...args: any) => providers.StaticJsonRpcProvider

export default function extendProvider<ClassProvider extends ProviderConstructor>(Provider: ClassProvider) {
  return class ProviderAdaptor extends Provider implements IAdaptor {
    #client: providers.StaticJsonRpcProvider | any

    readonly #url: string

    constructor(...args: any[]) {
      const client: providers.StaticJsonRpcProvider = args[0]
      const url = client.connection.url
      super({
        url,
        timeout: 10_000,
        throttleLimit: 3,
        throttleCallback: async (attempt: number, url: string) => {
          console.log(`[429]`, url, attempt)
          return true
        }
      }, client.network)

      this.#client = client
      this.#url = url
    }

    get client() {
      return this.#client
    }

    protected set client(c) {
      this.#client = c
    }

    get nodeUrl() {
      return this.#url
    }

    async sendTransaction(signedTransaction: string | Promise<string>): Promise<providers.TransactionResponse> {
      return new Promise((resolve, reject) => {
        const h = setTimeout(() => {
          console.log('tx_timeout')
          reject(new Error('Time out'))
        }, 10_000)

        super.sendTransaction(signedTransaction).then(res => {
          clearTimeout(h)
          resolve(res)
        }).catch(reject)
      })
    }

    async perform(method, params) {
      try {
        return await super.perform(method, params)
      } catch (e) {
        if (e.code === errors.CALL_EXCEPTION) {
          e.code = errors.SERVER_ERROR
        }
        throw e
      }
    }
  }
}
