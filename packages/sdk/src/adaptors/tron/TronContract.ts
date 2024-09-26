import TronWeb from 'tronweb'
import { utils } from 'ethers'

import TronAdaptor from './TronAdaptor'
import TronWallet from './TronWallet'

export default class TronContract {
  readonly #adaptor: TronAdaptor
  readonly #contract

  constructor(address: string, abi, adaptor: TronAdaptor) {
    this.#adaptor = adaptor
    this.#contract = this.#adaptor.client.contract(abi, address)

    Object.entries(this.#contract.methodInstances)
      .forEach(([name, { abi }]: [string, { abi: any }]) => {
        if (abi?.type === 'function') {
          if (['view', 'pure'].includes(abi.stateMutability)) {
            Object.defineProperty(this, name, {
              enumerable: true,
              value: (...args) => this._read(name, abi, args),
              writable: false,
            })
          } else {
            Object.defineProperty(this, name, {
              enumerable: true,
              value: (...args) => this._write(name, abi, args),
              writable: false,
            })
          }
        }
      })
  }

  get address() {
    return TronWeb.address.fromHex(this.#contract.address)
  }

  get provider() {
    return this.#adaptor
  }

  get signer() {
    if (this.#adaptor instanceof TronWallet) {
      return this.#adaptor
    }
    throw new Error(`TronWeb instance doesn't have a signer.`)
  }

  get interface() {
    return new utils.Interface(this.#contract.abi)
  }

  get filters() {
    throw new Error('TronContract.filters not implemented')
  }

  connect(providerOrTronWeb: TronAdaptor | TronWeb) {
    return new TronContract(this.address, this.#contract.abi, providerOrTronWeb)
  }

  queryFilter() {}
  on() {}
  removeAllListeners() {}

  async _read(name: string, abi, args: any[]) {
    let overrides
    if (args.length > abi.inputs.length) {
      overrides = args.pop()
    }
    return await this.#contract[name](...args).call(overrides)
  }

  async _write(name: string, abi, args: any[]) {
    let overrides
    if (args.length > abi.inputs.length) {
      overrides = args.pop()
    }
    return await (this.#adaptor as TronWallet).sendTransaction({
      contract: this.#contract,
      method: name,
      args,
    }, overrides)
  }
}
