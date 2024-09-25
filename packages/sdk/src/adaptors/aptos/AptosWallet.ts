import { utils } from 'ethers'
import { AptosAccount, TxnBuilderTypes, HexString } from 'aptos'
import AptosAdaptor from './AptosAdaptor'

export default class AptosWallet extends AptosAdaptor {
  readonly account: AptosAccount

  constructor(adaptor: AptosAdaptor, account: AptosAccount) {
    super(adaptor.client)
    this.account = account
  }

  get address() {
    return this.account.address().toString()
  }

  signMessage (msg: string) {
    return this.account.signBuffer(utils.toUtf8Bytes(msg)).hex()
  }

  async sendTransaction(payload, options) {
    const tx = await this.client.generateTransaction(this.account.address(), payload, options)
    const signed = await this.client.signTransaction(this.account, tx)
    const pending = await this.client.submitTransaction(signed)

    return {
      hash: utils.hexZeroPad(pending.hash, 32),
      wait: () => this.waitForTransaction(pending.hash)
    }
  }

  async deploy(module: string, metadata: string) {
    let hash = await this.client.publishPackage(
      this.account,
      new HexString(metadata).toUint8Array(),
      [new TxnBuilderTypes.Module(new HexString(module).toUint8Array())]
    )
    hash = utils.hexZeroPad(hash, 32)

    return {
      hash,
      wait: () => this.waitForTransaction(hash)
    }
  }
}

export class AptosExtWallet extends AptosWallet {
  readonly ext: any

  constructor(adaptor: AptosAdaptor, ext) {
    super(adaptor, null)
    this.ext = ext
  }

  get address() {
    // TODO: might be different for different exts
    return this.ext.signer.account() as string
  }

  async sendTransaction(payload, options) {
    // This method is provided by `@manahippo/aptos-wallet-adapter`
    const tx = await this.ext.signer.signAndSubmitTransaction(payload, options)
    // TODO: error handling
    return {
      hash: utils.hexZeroPad(tx.hash, 32),
      wait: () => this.waitForTransaction(tx.hash)
    }
  }

  async deploy(): Promise<any> {
    throw new Error('Cannot deploy with extention wallet')
  }
}
