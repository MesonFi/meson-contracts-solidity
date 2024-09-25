import { BigNumber, type BigNumberish } from 'ethers'
import {
  hd,
  helpers,
  commons,
  utils,
  type Script,
} from '@ckb-lumos/lumos'
import CkbAdaptor from './CkbAdaptor'

export default class CkbWallet extends CkbAdaptor {
  readonly #address: string
  readonly #privateKey: string
  readonly publicKey: string

  protected _pkhPrefix: string

  constructor(adaptor: CkbAdaptor, opt: { address?: string, privateKey?: string }) {
    super(adaptor.client)
    if (opt.privateKey) {
      this._pkhPrefix = '0x000000'
      this.#privateKey = opt.privateKey
      this.#address = helpers.encodeToAddress({
        codeHash: this.network.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
        hashType: this.network.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
        args: hd.key.publicKeyToBlake160(hd.key.privateToPublic(opt.privateKey)),
      }, { config: this.network })
    } else if (opt.address) {
      this.#address = opt.address
      this._pkhPrefix = this._prefixFromCodeHash(this.lockScript.codeHash)
    }
  }

  get address(): string {
    return this.#address
  }

  get lockScript(): Script {
    return helpers.parseAddress(this.address, { config: this.network })
  }

  get lockHash(): string {
    return utils.computeScriptHash(this.lockScript)
  }

  get pkh(): string {
    return this.lockScript.args.replace('0x', this._pkhPrefix)
  }

  async deploy() {}

  async _getTransferSkeleton({ to, value }) {
    const cellProvider = {
      collector: query => this.indexer.collector({ type: 'empty', data: '0x', ...query })
    }

    let txSkeleton = helpers.TransactionSkeleton({ cellProvider })
    txSkeleton = await commons.common.transfer(
      txSkeleton,
      [this.#address],
      to,
      BigNumber.from(value).toBigInt(),
      undefined,
      undefined,
      { config: this.network },
    )

    txSkeleton = await commons.common.payFeeByFeeRate(
      txSkeleton,
      [this.#address],
      1500,
      undefined,
      { config: this.network },
    )

    return txSkeleton
  }

  async sendTransaction(txObject: helpers.TransactionSkeletonType | { to: string, value: BigNumberish }, ...args: any[]) {
    if (!this.#address) {
      throw new Error('Cannot sign the transaction. No private key.')
    }
    let txSkeleton: helpers.TransactionSkeletonType
    if (!(txObject instanceof helpers.TransactionSkeleton)) {
      txSkeleton = await this._getTransferSkeleton(txObject as { to: string, value: any })
    } else {
      txSkeleton = txObject
    }
    const prepared = commons.common.prepareSigningEntries(txSkeleton, { config: this.network })
    const signatures = prepared.get('signingEntries')
      .map(({ message }) => hd.key.signRecoverable(message, this.#privateKey))
    const tx = helpers.sealTransaction(prepared, signatures.toJSON())
    const hash = await this.client.sendTransaction(tx, 'passthrough')
    return {
      hash,
      wait: () => this.waitForTransaction(hash)
    }
  }
}

export class CkbWalletFromJoyId extends CkbWallet {
  readonly ext: any

  constructor(adaptor: CkbAdaptor, ext) {
    super(adaptor, {})
    this.ext = ext
    this._pkhPrefix = '0x01'
  }

  get address(): string {
    return this.ext?.currentAccount?.address
  }

  async deploy(): Promise<any> {
    throw new Error('Cannot deploy with extention wallet')
  }

  async sendTransaction(txSkeleton: helpers.TransactionSkeletonType, witnessIndex: number = 0) {
    const converted = this.#convertTxSkeleton(txSkeleton)
    const tx = await this.ext?.signRawTransaction(converted, witnessIndex)
    const hash = await this.client.sendTransaction(tx, 'passthrough')
    return {
      hash,
      wait: () => this.waitForTransaction(hash)
    }
  }

  #convertTxSkeleton(txSkeleton: helpers.TransactionSkeletonType) {
    return {
      version: '0x0',
      cellDeps: txSkeleton.cellDeps.toJSON(),
      headerDeps: [],
      inputs: txSkeleton.inputs.toJSON().map((input, inputIndex) => ({
        previousOutput: input.outPoint,
        since: txSkeleton.inputSinces.get(inputIndex) || '0x0'
      })),
      outputs: txSkeleton.outputs.toJSON().map(output => output.cellOutput),
      outputsData: txSkeleton.outputs.toJSON().map(x => x.data),
      witnesses: txSkeleton.witnesses.toJSON(),
    }
  }
}
