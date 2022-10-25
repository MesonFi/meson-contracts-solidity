import { utils } from 'ethers'
import { AptosClient, AptosAccount, TxnBuilderTypes, HexString } from 'aptos'
import AptosAdaptor from './AptosAdaptor'

export default class AptosWallet extends AptosAdaptor {
  readonly account: AptosAccount

  constructor(client: AptosClient, account: AptosAccount) {
    super(client)
    this.account = account
  }

  async getAddress() {
    return this.account.address().toString()
  }

  async sendTransaction(payload, options) {
    const tx = await this.client.generateTransaction(this.account.address(), payload, options)
    const signed = await this.client.signTransaction(this.account, tx)
    const pending = await this.client.submitTransaction(signed)

    return {
      hash: utils.hexZeroPad(pending.hash, 32),
      wait: () => this.wait(pending.hash)
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
      wait: () => this.wait(hash)
    }
  }

  async wait(hash: string) {
    await this.client.waitForTransaction(hash, { checkSuccess: true })
  }
}

export class AptosExtWallet extends AptosWallet {
  readonly ext: any

  constructor(client: AptosClient, ext) {
    super(client, null)
    this.ext = ext
  }

  async getAddress() {
    return this.ext.signer.account() as string
  }

  async sendTransaction(payload, options) {
    // This method is provided by `@manahippo/aptos-wallet-adapter`
    const tx = await this.ext.signer.signAndSubmitTransaction(payload, options)
    // TODO: error handling
    return {
      hash: utils.hexZeroPad(tx.hash, 32),
      wait: async () => {}
    }
  }

  async deploy(): Promise<any> {
    throw new Error('Cannot deploy with extention wallet')
  }

  async wait(hash) {
    await this.client.waitForTransaction(hash, { checkSuccess: true })
  }
}
