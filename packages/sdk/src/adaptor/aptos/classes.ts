import { BigNumber } from 'ethers'
import { AptosClient, AptosAccount, CoinClient, TxnBuilderTypes, HexString } from 'aptos'

export class AptosProvider {
  readonly client: AptosClient

  constructor(client: AptosClient) {
    this.client = client
  }

  async getBalance(addr) {
    console.log('getBalance', addr)

    const type = `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`
    const result = await this.client.getAccountResource(new HexString(addr), type)
    return BigNumber.from((result.data as any).coin.value)
    // const accountResource = resources.find(r => r.type === typeTag)
    // return BigNumber.from(BigInt((accountResource!.data as any).coin.value))

    // const coinClient = new CoinClient(this.client)
    // return BigNumber.from(await coinClient.checkBalance(new HexString(addr)))
  }
}

export class AptosWallet extends AptosProvider {
  readonly signer: AptosAccount

  constructor(client: AptosClient, signer: AptosAccount) {
    super(client)
    this.signer = signer
  }

  getAddress() {
    return this.signer.address().toString()
  }

  async sendTransaction(payload) {
    const tx = await this.client.generateTransaction(this.signer.address(), payload)
    const signed = await this.client.signTransaction(this.signer, tx)
    const pending = await this.client.submitTransaction(signed)

    return {
      hash: pending.hash,
      wait: () => this.wait(pending.hash)
    }
  }

  async deploy(module, metadata) {
    const hash = await this.client.publishPackage(
      this.signer,
      new HexString(metadata).toUint8Array(),
      [new TxnBuilderTypes.Module(new HexString(module).toUint8Array())]
    )

    return {
      hash,
      wait: () => this.wait(hash)
    }
  }

  async wait(hash) {
    await this.client.waitForTransaction(hash, { checkSuccess: true })
  }
}
