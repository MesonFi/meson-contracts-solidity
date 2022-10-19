import { BigNumber } from 'ethers'
import { AptosClient, AptosAccount, TxnBuilderTypes, HexString } from 'aptos'

export class AptosProvider {
  readonly client: AptosClient

  constructor(client: AptosClient) {
    this.client = client
  }

  async detectNetwork(): Promise<any> {
    return await this.client.getLedgerInfo()
  }

  async getBlockNumber() {
    const info = await this.detectNetwork()
    return Number(info.block_height)
  }

  async getTransactionCount() {

  }

  async getBalance(addr) {
    const type = `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`
    try {
      const result = await this.client.getAccountResource(new HexString(addr), type)
      return BigNumber.from((result.data as any).coin.value)
    } catch (e) {
      if (e.errorCode === 'resource_not_found') {
        return BigNumber.from(0)
      }
      throw e
    }
  }

  async send(method, params) {
    if (method === 'eth_getBlockByNumber') {
      if (params[0] === 'latest') {
        const number = await this.getBlockNumber()
        const block = await this.client.getBlockByHeight(number, false)
        return _wrapAptosBlock(block)
      } else {
        return null
        const number = parseInt(params[0])
        const block = await this.client.getBlockByHeight(number, params[1])
        return _wrapAptosBlock(block)
      }
    } else if (method === 'eth_getBlockByHash') {
      if (params[0] === 'n/a') {
        return {}
      }
      return null
      const number = parseInt(params[0])
      const block = await this.client.getBlockByHeight(number, params[1])
      return _wrapAptosBlock(block)
    } else if (method === 'eth_getTransactionByHash') {
      return _wrapAptosTx(await this.client.getTransactionByHash(params[0]))
    } else if (method === 'eth_getTransactionReceipt') {
      return _wrapAptosTx(await this.client.getTransactionByHash(params[0]))
    }
  } 
}

function _wrapAptosBlock(raw) {
  return {
    hash: '0x' + Number(raw.block_height).toString(16),
    parentHash: '0x' + Number(raw.block_height - 1).toString(16),
    number: raw.block_height,
    timestamp: Math.floor(raw.block_timestamp / 1000).toString(),
    transactions: raw.transactions?.filter(tx => tx.type === 'user_transaction').map(_wrapAptosTx) || []
  }
}

function _wrapAptosTx(raw) {
  return {
    blockHash: 'n/a',
    blockNumber: '',
    hash: raw.hash,
    from: raw.sender,
    to: raw.payload?.function?.split('::')?.[0] || '',
    value: '0',
    input: JSON.stringify(raw.payload),
    timestamp: Math.floor(raw.timestamp / 1000_000).toString(),
    status: raw.success ? '0x1' : '0x0'
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
