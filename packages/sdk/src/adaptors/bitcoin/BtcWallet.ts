import { BigNumber } from 'ethers'
import axios from 'axios'
import * as btclib from 'bitcoinjs-lib'
import ecc from '@bitcoinerlab/secp256k1'

import BtcAdaptor from './BtcAdaptor'
import { ECPairInterface, ECPairFactory } from 'ecpair'

btclib.initEccLib(ecc)
const ECPair = ECPairFactory(ecc)

export default class BtcWallet extends BtcAdaptor {
  readonly #keypair: ECPairInterface
  readonly #pubkey: any
  readonly #address: string

  readonly #dustValue: number
  readonly #tolerance: number

  constructor(adaptor: BtcAdaptor, keypair?: any) {
    super(adaptor.client)
    if (keypair) {
      this.#keypair = keypair
      this.#pubkey = keypair.publicKey
      this.#address = btclib.payments.p2wpkh({ pubkey: this.pubkey, network: this.network }).address
    }

    this.#dustValue = 10000
    this.#tolerance = 4
  }

  get pubkey(): any {
    return this.#pubkey
  }

  get address(): string {
    return this.#address
  }

  async _getTransferSkeleton({ to, value }) {
    // Fetch utxos
    const response = await fetch(`${this.nodeUrl}/address/${this.#address}/utxo`)
    const utxos = await response.json()
    const feeRate = (await this._getFeeRate()).fastestFee

    // Collect utxos until reach the value
    let collectedValue = 0
    let utxoHexs = []
    let fee = Math.ceil((
      10.5 +      // vBytes for Overhead. See https://bitcoinops.org/en/tools/calc-size/
      31 * 2 +    // vBytes for 2 Outputs (P2WPKH)
      this.#tolerance   // vBytes for fault tolerance
    ) * feeRate)

    while (collectedValue < value + fee) {
      const utxo = utxos.pop()
      if (!utxo) throw new Error('Insufficient balance')
      if (utxo.value < this.#dustValue) continue
      const response = await fetch(`${this.nodeUrl}/tx/${utxo.txid}/hex`)
      const utxoHex = await response.text()
      utxoHexs.push([utxo.txid, utxo.vout, utxoHex])
      collectedValue += utxo.value
      fee += 68 * feeRate     // vBytes for an extra Input (P2WPKH)
    }

    // Build psbt
    const psbt = new btclib.Psbt({ network: this.network })
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
      value: collectedValue - value - Math.ceil(fee),
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
    const response = await axios.post(`${this.nodeUrl}/tx`, txHex, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    
    return {
      hash: response.data,
      wait: (confirmations: number) => this.waitForTransaction(response.data, confirmations)
    }
  }

  async sendTransaction({ to, value }: { swapId?: string, to: string, value: number }) {
    return this.transfer({ to, value })
  }
}

export class BtcWalletFromExtension extends BtcWallet {
  readonly ext: any

  constructor(adaptor: BtcAdaptor, ext: any) {
    super(adaptor)
    this.ext = ext
  }

  get address(): string {
    return this.ext?._selectedAddress
  }

  async deploy(): Promise<any> {
    throw new Error('Cannot deploy with extention wallet')
  }

  override async transfer({ to, value }) {
    const hash = await this.ext?.transfer(to, BigNumber.from(value).toNumber())
    return {
      hash,
      wait: () => this.waitForTransaction(hash)
    }
  }

  override async sendTransaction({ to, value }) {
    return this.transfer({ to, value })
  }
}
