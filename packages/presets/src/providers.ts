import { providers, errors } from 'ethers'
import sample from 'lodash/sample'
import { AptosClient, Types } from 'aptos'

function timer(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const h = setTimeout(() => {
      clearTimeout(h)
      resolve()
    }, ms)
  })
}

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    timer(ms).then(() => {
      throw new Error('Time out')
    })
  ])
}

type ExtendedOpenAPIConfig = Types.OpenAPIConfig & { BASE_URLS: string[] }

class AptosFallbackGeneratedClient extends Types.AptosGeneratedClient {
  #urls: string[]

  constructor(config?: Partial<ExtendedOpenAPIConfig>) {
    super(config)
    this.#urls = config.BASE_URLS

    const request = this.request.request

    const _fallbackRequest = async options => {
      if (!this.request.config.BASE) {
        this.request.config.BASE = sample(this.#urls)
      }
      try {
        return await timeout(request.call(this.request, options), 3000)
      } catch (e) {
        if (e.status === 404) {
          throw e
        }
        this.request.config.BASE = ''
        return _fallbackRequest(options)
      }
    }

    this.request.request = options => {
      return timeout(_fallbackRequest(options), 30_000) as any
    }
  }
}

const DEFAULT_VERSION_PATH_BASE = '/v1'
function _fixNodeUrl(nodeUrl: string): string {
  let out = `${nodeUrl}`
  if (out.endsWith('/')) {
    out = out.substring(0, out.length - 1)
  }
  if (!out.endsWith(DEFAULT_VERSION_PATH_BASE)) {
    out = `${out}${DEFAULT_VERSION_PATH_BASE}`
  }
  return out;
}

export class AptosFallbackClient extends AptosClient {
  constructor (urls: string[], config?: Partial<ExtendedOpenAPIConfig>, doNotFixNodeUrl: boolean = false) {
    super(urls[0], config, doNotFixNodeUrl)

    const conf = config === undefined || config === null ? {} : { ...config }

    if (doNotFixNodeUrl) {
      conf.BASE_URLS = urls
    } else {
      conf.BASE_URLS = urls.map(_fixNodeUrl)
    }
    conf.BASE = conf.BASE_URLS[0]

    if (config?.WITH_CREDENTIALS === false) {
      conf.WITH_CREDENTIALS = false
    } else {
      conf.WITH_CREDENTIALS = true
    }

    this.client = new AptosFallbackGeneratedClient(conf)
  }
}

export class RpcFallbackProvider extends providers.FallbackProvider {
  #currentProvider: providers.StaticJsonRpcProvider

  get currentProvider () {
    return this.#currentProvider
  }

  sampleRpc () {
    this.#currentProvider = sample(this.providerConfigs).provider as any
  }

  async send(method, params) {
    return await timeout(this._send(method, params), 30_000)
  }

  private async _send(method, params) {
    if (!this.#currentProvider) {
      this.sampleRpc()
    }

    try {
      return await timeout(this.#currentProvider.send(method, params), 3000)
    } catch (e) {
      this.#currentProvider = null
      return this._send(method, params)
    }
  }

  async perform(method: string, params: { [name: string]: any }): Promise<any> {
    if (method === 'sendTransaction') {
      return Promise.any(
        this.providerConfigs.map(c => c.provider.sendTransaction(params.signedTransaction))
      ).then(result => result.hash).catch(({ errors }) => { throw errors[0] })
    }

    return super.perform(method, params)
  }
}

export class FailsafeStaticJsonRpcProvider extends providers.StaticJsonRpcProvider {
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

export class FailsafeWebSocketProvider extends providers.WebSocketProvider {
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
