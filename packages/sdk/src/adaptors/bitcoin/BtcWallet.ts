import { ethers } from 'ethers'
import * as bitcoin from 'bitcoinjs-lib'
import BtcAdaptor from './BtcAdaptor'

export default class BtcWallet extends BtcAdaptor {
  readonly #pubkey: any
  readonly #address: string

  constructor(client: BtcAdaptor, keypair: any) {
    super(client)
    this.#pubkey = keypair.publicKey
    this.#address = bitcoin.payments.p2pkh({ pubkey: this.pubkey, network: this.network }).address
  }

  get pubkey(): any {
    return this.#pubkey
  }

  get address(): string {
    return this.#address
  }

  async sendTransaction({ to, value }) {
    console.log(to, value.toString())
    // TODO

    return {
      hash: 'xxx',
      wait: () => {}
    }
  }
}

export class BtcWalletFromExtension extends BtcWallet {
  readonly ext: any

  constructor(client: BtcAdaptor, ext) {
    super(client, {})
    this.ext = ext
  }
}
