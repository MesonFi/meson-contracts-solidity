import { RPC as CkbRPC } from '@ckb-lumos/lumos'
import { TonClient, type TonClientParameters } from '@ton/ton'

export class ExtendedCkbClient extends CkbRPC {
  readonly metadata: any

  constructor(url: string, config: any, metadata: any) {
    super(url, config || {})
    this.metadata = metadata
  }
}

export class ExtendedTonClient extends TonClient {
  readonly metadata: any

  constructor(parameters: TonClientParameters, metadata: any) {
    super(parameters)
    this.metadata = metadata
  }
}
