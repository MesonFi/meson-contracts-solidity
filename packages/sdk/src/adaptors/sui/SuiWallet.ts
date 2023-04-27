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

  signMessage (msg: string) {
    return utils.hexlify(this.keypair.signData(utils.toUtf8Bytes(msg)))
  }

  async sendTransaction(tx: TransactionBlock, options?: SuiTransactionBlockResponseOptions) {
    const result = await this.signer.signAndExecuteTransactionBlock({ transactionBlock: tx, options: { showObjectChanges: true, ...options } })
    return {
      hash: result.digest,
      wait: () => this._wrapSuiTx(result)
    }
  }

  _moveCallsFromTx (tx: TransactionBlock) {
    return tx.blockData.transactions.map(tx => {
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
    // TODO
    return this.ext.signer.account() as string
  }

  async deploy(): Promise<any> {
    throw new Error('Cannot deploy with extention wallet')
  }
}
