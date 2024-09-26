import { networks } from 'bitcoinjs-lib'

export default class BtcClient {
  readonly url: string
  readonly isTestnet: boolean
  readonly mesonAddress: string

  constructor(url: string, isTestnet?: boolean, mesonAddress?: string) {
    this.url = url
    this.isTestnet = isTestnet
    this.mesonAddress = mesonAddress
  }

  get network() {
    return this.isTestnet ? networks.testnet : networks.bitcoin
  }
}
