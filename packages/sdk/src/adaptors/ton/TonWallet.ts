// import { ethers } from 'ethers'
import { Address, OpenedContract, Sender, WalletContractV4 } from "@ton/ton";
import { KeyPair } from "@ton/crypto";
import TonAdaptor from "./TonAdaptor";

export default class TonWallet extends TonAdaptor {
  readonly #pubkey: Buffer
  readonly #wallet: WalletContractV4
  readonly #walletContract: OpenedContract<WalletContractV4>
  readonly #walletSender: Sender
  readonly #address: Address


  constructor(adaptor: TonAdaptor, keypair: KeyPair) {
    super(adaptor)
    this.#pubkey = keypair.publicKey
    this.#wallet = WalletContractV4.create({ workchain: 0, publicKey: keypair.publicKey })
    this.#walletContract = adaptor.client.open(this.#wallet)
    this.#walletSender = this.#walletContract.sender(keypair.secretKey)
    this.#address = this.#wallet.address
  }

  get pubkey(): Buffer {
    return this.#pubkey
  }

  get address(): string {
    return this.#address.toString()
  }

  // async transfer({ to, value }) {
  //   const tx = await this.tronWeb.transactionBuilder.sendTrx(to, value.toString())
  //   const signed = await this.tronWeb.trx.sign(tx)
  //   const receipt = await this.tronWeb.trx.sendRawTransaction(signed)
  //   return {
  //     hash: receipt.txID,
  //     wait: (confirmations: number) => this.waitForTransaction(receipt.txID, confirmations)
  //   }
  // }

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
