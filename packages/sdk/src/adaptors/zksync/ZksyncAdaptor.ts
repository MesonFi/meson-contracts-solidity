import { Provider as ZkProvider } from 'zksync-web3'

import { IAdaptor } from '../types'
import extendProvider from '../ethers/extendProvider'

export default class ZksyncAdaptor extends extendProvider(ZkProvider) implements IAdaptor {
  constructor(client: ZkProvider) {
    super(client as any)
  }
}
