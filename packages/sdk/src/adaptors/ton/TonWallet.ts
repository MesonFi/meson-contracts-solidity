// import { ethers } from 'ethers'
import { Address, Cell, internal, OpenedContract, Sender, WalletContractV4 } from "@ton/ton";
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
    this.#publicKey = keypair.publicKey
    this.#secretKey = keypair.secretKey
    this.#wallet = WalletContractV4.create({ workchain: 0, publicKey: keypair.publicKey })
    this.#walletContract = adaptor.client.open(this.#wallet)
    this.#walletSender = this.#walletContract.sender(keypair.secretKey)
    this.#address = this.#wallet.address
  }

  get pubkey(): Buffer {
    return this.#publicKey
  }

  get address(): string {
    return this.#address.toString()
  }

  async transfer(to: string | Address, value: string | bigint) {
    return this.sendTransaction({ to, value })
  }

  async sendTransaction(data: { to: string | Address, value: string | bigint, body?: Cell}) {
    const seqno = await this.#walletContract.getSeqno()
    const submitTs = Math.floor(Date.now() / 1e3)
    await this.#walletContract.sendTransfer({
      seqno,
      secretKey: this.#secretKey,
      messages: [internal(data)]
    })
    return {
      hash: null, // Can't get hash right after submitting
      wait: () => this.waitForCompletion(submitTs, this.#address),
    }
  }

  // async deploy() {}
}
