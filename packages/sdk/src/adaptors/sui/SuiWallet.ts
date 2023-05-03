import { utils } from 'ethers'
import {
  JsonRpcProvider as SuiProvider,
  Keypair as SuiKeypair,
  RawSigner,
  TransactionBlock,
  type SuiTransactionBlockResponseOptions,
} from '@mysten/sui.js'
import SuiAdaptor from './SuiAdaptor'

export default class SuiWallet extends SuiAdaptor {
  readonly keypair: SuiKeypair
  readonly signer: RawSigner

  constructor(client: SuiProvider, keypair?: SuiKeypair) {
    super(client)
    if (keypair) {
      this.keypair = keypair
      this.signer = new RawSigner(keypair, client)
    }
  }

  get address() {
    return this.keypair.getPublicKey().toSuiAddress()
  }

  async transfer({ to, value }, options?: SuiTransactionBlockResponseOptions) {
    const txb = new TransactionBlock()
    const [coin] = txb.splitCoins(txb.gas, [txb.pure(value)])
    txb.transferObjects([coin], txb.pure(to))
    const result = await this.signer.signAndExecuteTransactionBlock({ transactionBlock: txb, options: { showObjectChanges: true, ...options } })
    return {
      hash: result.digest,
      wait: () => this._wrapSuiTx(result)
    }
  }

  signMessage (msg: string) {
    return utils.hexlify(this.keypair.signData(utils.toUtf8Bytes(msg)))
  }

  async sendTransaction(txb: TransactionBlock, options?: SuiTransactionBlockResponseOptions) {
    const result = await this.signer.signAndExecuteTransactionBlock({ transactionBlock: txb, options: { showObjectChanges: true, ...options } })
    return {
      hash: result.digest,
      wait: () => this._wrapSuiTx(result)
    }
  }

  _moveCallsFromTx (txb: TransactionBlock) {
    return txb.blockData.transactions.map(tx => {
      if (tx.kind === 'MoveCall') {
        return {
          ...tx,
          arguments: tx.arguments.map(arg => {
            if (arg.kind === 'Input') {
              if (typeof arg.value === 'number' || typeof arg.value === 'string') {
                return arg.value
              } else if (Array.isArray(arg.value)) {
                return utils.hexlify(arg.value)
              }
            }
          })
        }
      }
    }).filter(Boolean)
  }

  async deploy(module: string, metadata: string) {
    throw new Error('Not implemented')
  }
}

export class SuiExtWallet extends SuiWallet {
  readonly ext: any

  constructor(client: SuiProvider, ext) {
    super(client)
    this.ext = ext
  }

  get address() {
    return this.ext.signer.accounts?.[0]?.address as string
  }

  async sendTransaction(txb: TransactionBlock, options?: SuiTransactionBlockResponseOptions) {
    const feat = this.ext.signer.features['sui:signAndExecuteTransactionBlock']
    const result = await feat.signAndExecuteTransactionBlock({ transactionBlock: txb, options: { showObjectChanges: true, ...options } })
    return {
      hash: result.digest,
      wait: () => this._wrapSuiTx(result)
    }
  }

  async deploy(): Promise<any> {
    throw new Error('Cannot deploy with extention wallet')
  }
}
