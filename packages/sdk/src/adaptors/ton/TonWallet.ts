// import { ethers } from 'ethers'
import { KeyPair } from '@ton/crypto'
import { beginCell, storeMessage } from '@ton/core'
import { Address, Cell, internal, external, OpenedContract, Sender, WalletContractV4 } from '@ton/ton'

import TonAdaptor from './TonAdaptor'

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

  async transfer(to: string, value: bigint) {
    return this.sendTransaction({ to, value })
  }

  async sendTransaction(data: { to: string, value: bigint, body?: Cell, swapId?: string }) {
    const seqno = await this.#walletContract.getSeqno()
    const transfer = this.#wallet.createTransfer({
      seqno,
      secretKey: this.#secretKey,
      messages: [internal(data)]
    })
    const msg = external({ to: this.#address, init: null, body: transfer })
    const cell = beginCell().store(storeMessage(msg)).endCell()
    const hash = cell.hash().toString('hex')
    await this.client.sendFile(cell.toBoc())
    return {
      hash,
      wait: (_: number) => this.waitForTransaction(hash),
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

  async sendTransaction(data: { to: string, value: bigint, body?: Cell, swapId?: string }) {
    const submitTs = Math.floor(Date.now() / 1e3)
    const hash = await this.ext?.sendTransaction({
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
      hash,
      wait: () => this.waitForTransaction(hash),
    }
  }

  async deploy(): Promise<any> {
    throw new Error('Cannot deploy with extention wallet')
  }
}
