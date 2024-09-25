import { utils } from 'ethers'
import {
  Keypair as SolKeypair,
  PublicKey as SolPublicKey,
  Transaction as SolTransaction,
  SystemProgram,
} from '@solana/web3.js'
import nacl from 'tweetnacl'
import SolanaAdaptor from './SolanaAdaptor'

export default class SolanaWallet extends SolanaAdaptor {
  readonly keypair: SolKeypair

  constructor(adaptor: SolanaAdaptor, keypair: SolKeypair) {
    super(adaptor.client)
    this.keypair = keypair
  }

  get publicKey() {
    return this.keypair.publicKey
  }

  get address() {
    return this.publicKey.toString()
  }

  signMessage(msg: string) {
    let signData: Uint8Array
    if (utils.isHexString(msg)) {
      signData = utils.arrayify(msg)
    } else {
      signData = utils.toUtf8Bytes(msg)
    }
    const signature = nacl.sign.detached(signData, this.keypair.secretKey)
    return utils.hexlify(signature)
  }

  async sendTransaction(tx, options?) {
    if (!(tx instanceof SolTransaction)) {
      tx = new SolTransaction().add(
        SystemProgram.transfer({
          fromPubkey: this.publicKey,
          toPubkey: new SolPublicKey(tx.to),
          lamports: tx.value.toString(),
        })
      )
    }
    const hash = await this.client.sendTransaction(tx, [this.keypair])
    return {
      hash,
      wait: () => this.waitForTransaction(hash, 1)
    }
  }

  async deploy(module: string, metadata: string) {
  }
}

export class SolanaExtWallet extends SolanaWallet {
  readonly ext: any

  constructor(adaptor: SolanaAdaptor, ext) {
    super(adaptor, null)
    this.ext = ext
  }

  get publicKey() {
    return new SolPublicKey(this.address)
  }

  get address() {
    return this.ext?.currentAccount?.address
  }

  async sendTransaction(tx: SolTransaction, options?) {
    tx.recentBlockhash = await this.detectNetwork()
    tx.feePayer = this.publicKey
    const hash = await this.ext.sendTransaction(tx)
    return {
      hash,
      wait: () => this.waitForTransaction(hash, 1)
    }
  }

  async deploy(): Promise<any> {
    throw new Error('Cannot deploy with extention wallet')
  }
}
