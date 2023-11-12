import sol from '@solana/web3.js'
import SolanaAdaptor from './SolanaAdaptor'

export default class SolanaWallet extends SolanaAdaptor {
  readonly keypair: sol.Keypair

  constructor(client: sol.Connection, keypair: sol.Keypair) {
    super(client)
    this.keypair = keypair
  }

  get publicKey() {
    return this.keypair.publicKey
  }

  get address() {
    return this.publicKey.toString()
  }

  signMessage (msg: string) {
    // TODO
  }

  async sendTransaction(tx, options) {
    // return {
    //   hash: '',
    //   wait: () => this.waitForTransaction(pending.hash)
    // }
  }

  async deploy(module: string, metadata: string) {
  }
}

export class SolanaExtWallet extends SolanaWallet {
  readonly ext: any

  constructor(client: sol.Connection, ext) {
    super(client, null)
    this.ext = ext
  }

  get address() {
    return ''
  }

  async sendTransaction(payload, options) {
  }

  async deploy(): Promise<any> {
    throw new Error('Cannot deploy with extention wallet')
  }
}
