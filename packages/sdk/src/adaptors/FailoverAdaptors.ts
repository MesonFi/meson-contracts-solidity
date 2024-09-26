import type { IAdaptor, AdaptorConstructor } from './types'
import { timeout } from '../utils'

import EthersAdaptor from './ethers/EthersAdaptor'
import ZksyncAdaptor from './zksync/ZksyncAdaptor'
import AptosAdaptor from './aptos/AptosAdaptor'
import BtcAdaptor from './bitcoin/BtcAdaptor'
import CkbAdaptor from './ckb/CkbAdaptor'
import SolanaAdaptor from './solana/SolanaAdaptor'
import StarkAdaptor from './starknet/StarkAdaptor'
import SuiAdaptor from './sui/SuiAdaptor'
import TronAdaptor from './tron/TronAdaptor'

function extendToFailoverAdaptor<ClassAdaptor extends AdaptorConstructor>(Adaptor: ClassAdaptor): ClassAdaptor {
  return class FailoverAdaptor extends Adaptor {
    readonly adaptors: IAdaptor[]

    constructor(...args: any[]) {
      const adaptors = args[0] as IAdaptor[]
      super(adaptors[0].client)
      this.adaptors = adaptors
    }

    // override get nodeUrl() {
    //   return this.adaptors.map(adp => adp.nodeUrl).join('\n')
    // }

    switch() {
      const adaptors = [...this.adaptors].sort(() => Math.random() - 0.5)
      super.client = adaptors[0].client
    }

    get currentClient() {
      return super.client
    }

    get client() {
      const that = this
      return new Proxy({}, {
        get(target, prop: string) {
          if (typeof that.currentClient[prop] !== 'function') {
            return that.currentClient[prop]
          }
          const adaptors = [...that.adaptors].sort(() => Math.random() - 0.5)

          return (...args) => {
            const current = adaptors.pop()
            const result = current.client[prop](...args)
            if (!result.then) {
              return result
            }

            const errors = []
            return new Promise(async (resolve, reject) => {
              try {
                resolve(await timeout(result, 3000))
                return
              } catch (e) {
                errors.push(e)
              }

              while (adaptors.length) {
                const current = adaptors.pop()
                try {
                  resolve(await timeout(current.client[prop](...args), 3000))
                  return
                } catch (e) {
                  errors.push(e)
                }
              }

              reject(new AggregateError(errors, 'All failed'))
            })
          }
        }
      })
    }

    async send(method, params) {
      return await timeout(this._send(method, params), 30_000)
    }

    private async _send(method, params) {
      const adaptors = [...this.adaptors].sort(() => Math.random() - 0.5)
      const errors = []
      while (adaptors.length) {
        const current = adaptors.pop()
        try {
          return await timeout(current.send(method, params), 3000)
        } catch (e) {
          errors.push(e)
        }
      }
      throw new AggregateError(errors, 'All failed')
    }

    async sendTransaction(tx: any) {
      return new Promise((resolve, reject) => {
        let success = false
        const errors = []
        Promise.all(this.adaptors.map(adp => (adp as any).sendTransaction(tx)
          .then((result: any) => {
            success = true
            resolve(result)
          })
          .catch((e: Error) => errors.push(e))
        )).then(() => {
          if (!success) {
            reject(new AggregateError(errors, 'All failed (sendTransaction)'))
          }
        })
      })
    }
  }
}

export class FailoverEthersAdaptor extends extendToFailoverAdaptor(EthersAdaptor) {
  constructor(...adaptors: EthersAdaptor[]) {
    super(adaptors as any)
  }
}

export class FailoverZksyncAdaptor extends extendToFailoverAdaptor(ZksyncAdaptor) {
  constructor(...adaptors: ZksyncAdaptor[]) {
    super(adaptors as any)
  }
}

export class FailoverAptosAdaptor extends extendToFailoverAdaptor(AptosAdaptor) {
  constructor(...adaptors: AptosAdaptor[]) {
    super(adaptors as any)
  }
}

export class FailoverBtcAdaptor extends extendToFailoverAdaptor(BtcAdaptor) {
  constructor(...adaptors: BtcAdaptor[]) {
    super(adaptors as any)
  }
}

export class FailoverCkbAdaptor extends extendToFailoverAdaptor(CkbAdaptor) {
  constructor(...adaptors: CkbAdaptor[]) {
    super(adaptors as any)
  }
}

export class FailoverSolanaAdaptor extends extendToFailoverAdaptor(SolanaAdaptor) {
  constructor(...adaptors: SolanaAdaptor[]) {
    super(adaptors as any)
  }
}

export class FailoverStarkAdaptor extends extendToFailoverAdaptor(StarkAdaptor) {
  constructor(...adaptors: StarkAdaptor[]) {
    super(adaptors as any)
  }
}

export class FailoverSuiAdaptor extends extendToFailoverAdaptor(SuiAdaptor) {
  constructor(...adaptors: SuiAdaptor[]) {
    super(adaptors as any)
  }
}

export class FailoverTronAdaptor extends extendToFailoverAdaptor(TronAdaptor) {
  constructor(...adaptors: TronAdaptor[]) {
    super(adaptors as any)
  }
}
