import { RPC as CkbRPC } from '@ckb-lumos/lumos'

export class ExtendedCkbClient extends CkbRPC {
  readonly metadata: any

  constructor(url: string, config: any, metadata: any) {
    super(url, config || {})
    this.metadata = metadata
  }
}
