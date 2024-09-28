import { RPC as CkbRPC } from '@ckb-lumos/lumos'
import { TonClient, TonClientParameters } from '@ton/ton'

export class ExtendedCkbClient extends CkbRPC {
  readonly metadata: any

  constructor(url: string, config: any, metadata: any) {
    super(url, config || {})
    this.metadata = metadata
  }
}

export class ExtendedTonClient extends TonClient {
  readonly tokens: any

  constructor(parameters: TonClientParameters, tokens: any) {
    super(parameters)
    this.tokens = tokens
  }
}