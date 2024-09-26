import TronAdaptor from './TronAdaptor'

export default class TronWallet extends TronAdaptor {
  constructor(adaptor: TronAdaptor) {
    super(adaptor.client)
  }

  get tronWeb () {
    return this.client
  }

  get address() {
    return this.tronWeb.defaultAddress.base58
  }

  async transfer({ to, value }) {
    const tx = await this.tronWeb.transactionBuilder.sendTrx(to, value.toString())
    const signed = await this.tronWeb.trx.sign(tx)
    const receipt = await this.tronWeb.trx.sendRawTransaction(signed)
    return {
      hash: receipt.txID,
      wait: (confirmations: number) => this.waitForTransaction(receipt.txID, confirmations)
    }
  }

  async sendTransaction(payload, overrides) {
    if (!payload.contract) {
      return await this.transfer(payload)
    }
    const { contract, method, args } = payload
    const hash = await contract[method](...args).send(overrides)
    return {
      hash,
      wait: (confirmations: number) => this.waitForTransaction(hash, confirmations)
    }
  }

  async deploy() {}

  async getTransaction(hash: string): Promise<any> {
    while (true) {
      try {
        return await this.send('eth_getTransactionByHash', [hash])
      } catch {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
}
