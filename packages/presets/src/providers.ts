import { providers, errors } from 'ethers'
import { RPC as CkbRPC } from '@ckb-lumos/lumos'

export class FailsafeStaticJsonRpcProvider extends providers.StaticJsonRpcProvider {
  constructor(url: string, network: providers.Networkish) {
    super({
      url,
      timeout: 10_000,
      throttleLimit: 3,
      throttleCallback: async (attempt: number, url: string) => {
        console.log(`[429]`, url, attempt)
        return true
      }
    }, network)
  }

  async sendTransaction (signedTransaction: string | Promise<string>): Promise<providers.TransactionResponse> {
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

  async perform (method, params) {
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

export class ExtendedCkbClient extends CkbRPC {
  readonly metadata: any

  constructor(url: string, config: any, metadata: any) {
    super(url, config || {})
    this.metadata = metadata
  }
}
