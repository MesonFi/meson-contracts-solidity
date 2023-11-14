import { utils } from 'ethers'
import sol from '@solana/web3.js'
import nacl from 'tweetnacl'
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
    let signData: Uint8Array
    if (utils.isHexString(msg)) {
      signData = utils.arrayify(msg)
    } else {
      signData = utils.toUtf8Bytes(msg)
    }
    const signature = nacl.sign.detached(signData, this.keypair.secretKey)
    return utils.hexlify(signature)
  }

  async sendTransaction(tx: sol.Transaction, options?) {
    const hash = await sol.sendAndConfirmTransaction(this.client, tx, [this.keypair])
    return {
      hash,
      wait: () => this.waitForTransaction(hash)
    }
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

  async sendTransaction(tx: sol.Transaction, options?) {
    const hash = ''
    return {
      hash,
      wait: () => this.waitForTransaction(hash)
    }
  }

  async deploy(): Promise<any> {
    throw new Error('Cannot deploy with extention wallet')
  }
}
