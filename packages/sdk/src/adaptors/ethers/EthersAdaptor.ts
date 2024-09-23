import { providers } from 'ethers'

import { IAdaptor } from '../types'
import extendProvider from './extendProvider'

export default class EthersAdaptor extends extendProvider(providers.JsonRpcProvider) implements IAdaptor {
  constructor(client: providers.StaticJsonRpcProvider) {
    super(client as any)
  }
}
