import { providers } from 'ethers'

import { IAdaptor } from '../types'
import extendProvider from './extendProvider'

export default class EthersAdaptor extends extendProvider(providers.StaticJsonRpcProvider) implements IAdaptor {
  constructor(client: providers.JsonRpcProvider) {
    super(client as any)
  }
}
