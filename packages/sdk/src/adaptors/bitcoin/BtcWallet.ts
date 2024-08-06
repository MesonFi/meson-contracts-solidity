import { ethers } from 'ethers'
import axios from 'axios'
import * as bitcoin from 'bitcoinjs-lib'
import * as tinysecp from 'tiny-secp256k1';
import BtcAdaptor from './BtcAdaptor'
import { ECPairInterface, ECPairFactory } from 'ecpair'

bitcoin.initEccLib(tinysecp);
const ECPair = ECPairFactory(tinysecp);

export default class BtcWallet extends BtcAdaptor {
  readonly #pubkey: any
  readonly #address: string
  readonly #keypair: ECPairInterface

  readonly #dustValue: number
  readonly #feeAll: number

  constructor(client: BtcAdaptor, keypair: any) {
    super(client, client.isTestnet)
    this.#pubkey = keypair.publicKey
    this.#address = bitcoin.payments.p2pkh({ pubkey: this.pubkey, network: this.network }).address
    this.#keypair = keypair

    this.#dustValue = 10000
    this.#feeAll = 40000
  }

  get pubkey(): any {
    return this.#pubkey
  }

  get address(): string {
    return this.#address
  }

  async _getTransferSkeleton({ to, value }) {
    // Fetch utxos
    const response = await fetch(`${this.url}/address/${this.#address}/utxo`)
    const utxos = await response.json()

    // Collect utxos until reach the value
    let collectedValue = 0
    let utxoHexs = []
    while (collectedValue < value + this.#feeAll) {
      const utxo = utxos.pop()
      if (!utxo) throw new Error('Insufficient balance')
      if (utxo.value < this.#dustValue) continue
      const response = await fetch(`${this.url}/tx/${utxo.txid}/hex`)
      const utxoHex = await response.text()
      utxoHexs.push([utxo.txid, utxo.vout, utxoHex])
      collectedValue += utxo.value
    }

    // Build psbt
    const psbt = new bitcoin.Psbt({ network: this.network })
    for (const [txid, vout, hex] of utxoHexs) {
      psbt.addInput({
        hash: txid,
        index: vout,
        nonWitnessUtxo: Buffer.from(hex, 'hex'),
      })
    }

    // Add outputs
    psbt.addOutput({
      address: to,
      value: value,
    })
    psbt.addOutput({
      address: this.#address,
      value: collectedValue - value - this.#feeAll,
    })

    return psbt
  }


  async transfer({ to, value }) {
    // Collect signatures
    const psbt = await this._getTransferSkeleton({ to, value })
    psbt.signAllInputs(this.#keypair)

    // Validate and finalize
    const validator = (pubkey: Buffer, msghash: Buffer, signature: Buffer) =>
      ECPair.fromPublicKey(pubkey).verify(msghash, signature)
    psbt.validateSignaturesOfInput(0, validator)
    psbt.finalizeAllInputs()

    // Broadcast
    const txHex = psbt.extractTransaction().toHex()
    const response = await axios.post(`${this.url}/tx`, txHex, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    
    return {
      hash: response.data,
      wait: (confirmations: number) => this.waitForTransaction(response.data, confirmations)
    }
  }

  async sendTransaction({ to, value }) {
    return this.transfer({ to, value })
  }
}

export class BtcWalletFromExtension extends BtcWallet {
  readonly ext: any

  constructor(client: BtcAdaptor, ext) {
    super(client, {})
    this.ext = ext
  }

  get address(): string {
    return this.ext?._selectedAddress
  }

  async deploy(): Promise<any> {
    throw new Error('Cannot deploy with extention wallet')
  }

  override async transfer({ to, value }) {
    return this.ext?.sendBitcoin(to, value)
  }

  override async sendTransaction({ to, value }) {
    return this.transfer({ to, value })
  }
}
