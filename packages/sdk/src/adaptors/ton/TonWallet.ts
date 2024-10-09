// import { ethers } from 'ethers'
import { Address, Cell, internal, OpenedContract, Sender, WalletContractV4 } from "@ton/ton";
import { Transaction as TonTransaction } from '@ton/core'
import { KeyPair } from "@ton/crypto";
import TonAdaptor from "./TonAdaptor";

export default class TonWallet extends TonAdaptor {
  readonly #publicKey: Buffer
  readonly #secretKey: Buffer
  readonly #wallet: WalletContractV4
  readonly #walletContract: OpenedContract<WalletContractV4>
  readonly #walletSender: Sender
  readonly #address: Address

  constructor(adaptor: TonAdaptor, keypair?: KeyPair) {
    super(adaptor.client)
    if (keypair) {
      this.#publicKey = keypair.publicKey
      this.#secretKey = keypair.secretKey
      this.#wallet = WalletContractV4.create({ workchain: 0, publicKey: keypair.publicKey })
      this.#walletContract = adaptor.client.open(this.#wallet)
      this.#walletSender = this.#walletContract.sender(keypair.secretKey)
      this.#address = this.#wallet.address
    }
  }

  get pubkey(): Buffer {
    return this.#publicKey
  }

  get address(): string {
    return this.#address.toString({ bounceable: false })
  }

  async transfer(to: string | Address, value: string | bigint) {
    return this.sendTransaction({ to, value })
  }

  async sendTransaction(data: { to: string | Address, value: string | bigint, body?: Cell, swapId?: string }) {
    const seqno = await this.#walletContract.getSeqno()
    const submitTs = Math.floor(Date.now() / 1e3)
    await this.#walletContract.sendTransfer({
      seqno,
      secretKey: this.#secretKey,
      messages: [internal(data)]
    })
    return {
      hash: null, // Can't get hash right after submitting
      wait: (_: number) => this.waitForCompletion(submitTs, this.#address),
    }
  }
}

export class TonExtWallet extends TonWallet {
  readonly ext: any

  constructor(adaptor: TonAdaptor, ext) {
    super(adaptor)
    this.ext = ext
  }

  get address() {
    return this.ext?.currentAccount?.address
  }

  async sendTransaction(data: { to: string | Address, value: string | bigint, body?: Cell, swapId?: string }) {
    const submitTs = Math.floor(Date.now() / 1e3)
    const result = await this.ext?.sendTransaction({
      validUntil: submitTs + 120,
      messages: [
        {
          address: data.to.toString(),
          amount: data.value.toString(),
          payload: data.body?.toBoc().toString('base64'),
        }
      ]
    })
    return {
      hash: result.boc,
      wait: () => this.waitForCompletion(result.boc, this.address),
    }
  }

  async deploy(): Promise<any> {
    throw new Error('Cannot deploy with extention wallet')
  }
}
