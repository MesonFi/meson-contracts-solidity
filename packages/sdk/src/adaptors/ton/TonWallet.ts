// import { ethers } from 'ethers'
import { Address, internal, OpenedContract, Sender, WalletContractV4 } from "@ton/ton";
import { KeyPair } from "@ton/crypto";
import TonAdaptor from "./TonAdaptor";

export default class TonWallet extends TonAdaptor {
  readonly #publicKey: Buffer
  readonly #secretKey: Buffer
  readonly #wallet: WalletContractV4
  readonly #walletContract: OpenedContract<WalletContractV4>
  readonly #walletSender: Sender
  readonly #address: Address


  constructor(adaptor: TonAdaptor, keypair: KeyPair) {
    super(adaptor)
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

  async transfer({ to, value }) {
    const seqno = await this.#walletContract.getSeqno()
    const nowTs = Math.floor(Date.now() / 1e3)
    await this.#walletContract.sendTransfer({
      seqno,
      secretKey: this.#secretKey,
      messages: [internal({ to, value })]
    })
    return await this.waitForCompletion(nowTs, this.#address)
  }

  // async sendTransaction(payload, overrides) {
  //   if (!payload.contract) {
  //     return await this.transfer(payload)
  //   }
  //   const { contract, method, args } = payload
  //   const hash = await contract[method](...args).send(overrides)
  //   return {
  //     hash,
  //     wait: (confirmations: number) => this.waitForTransaction(hash, confirmations)
  //   }
  // }

  // async deploy() {}

  // async getTransaction(hash: string): Promise<any> {
  //   while (true) {
  //     try {
  //       return await this.send('eth_getTransactionByHash', [hash])
  //     } catch {
  //       await new Promise(resolve => setTimeout(resolve, 1000))
  //     }
  //   }
  // }
}
