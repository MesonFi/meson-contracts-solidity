import { BigNumber, utils } from 'ethers'
import {
  JsonRpcProvider as SuiProvider,
  type SuiTransactionBlockResponse
} from '@mysten/sui.js'

export default class SuiAdaptor {
  readonly client: SuiProvider

  constructor(client: SuiProvider) {
    this.client = client
  }

  get nodeUrl() {
    // TODO
    return this.client.connection.fullnode
  }

  async detectNetwork(): Promise<any> {
    return await this.client.getRpcApiVersion()
  }

  async getBlockNumber() {
    // TODO
    return Number(0)
  }

  async getTransactionCount() {

  }

  async getBalance(addr) {
    const data = await this.client.getBalance({ owner: addr })
    return BigNumber.from(data.totalBalance)
  }

  on () {}
  removeAllListeners () {}

  async send(method, params) {
    if (method === 'eth_getBlockByNumber') {
      if (params[0] === 'latest') {
        // const number = await this.getBlockNumber()
        // const block = await this.client.getBlockByHeight(number, false)
        return _wrapSuiBlock()
      } else {
        // const number = parseInt(params[0])
        // const block = await this.client.getBlockByHeight(number, params[1])
        return _wrapSuiBlock()
      }
    } else if (method === 'eth_getBlockByHash') {
      if (params[0] === 'n/a') {
        return {}
      }
      // const number = parseInt(params[0])
      // const block = await this.client.getBlockByHeight(number, params[1])
      return _wrapSuiBlock()
    } else if (method === 'eth_getTransactionByHash' || method === 'eth_getTransactionReceipt') {
      return await this.waitForTransaction(params[0])
    }
  }

  async waitForTransaction(digest: string, confirmations?: number, timeout?: number) {
    const txRes = await this.client.getTransactionBlock({ digest, options: { showInput: true, showObjectChanges: true } })
    return this._wrapSuiTx(txRes)
  }

  _wrapSuiTx(txRes: SuiTransactionBlockResponse) {
    const moveCalls = this._moveCallsFromTxResponse(txRes)

    return {
      blockHash: 'n/a',
      blockNumber: '',
      hash: txRes.digest,
      from: utils.hexZeroPad(txRes.transaction?.data.sender || '0x', 32),
      to: moveCalls?.[0]?.package,
      value: '0',
      input: JSON.stringify(moveCalls),
      timestamp: Math.floor(Number(txRes.timestampMs) / 1000).toString(),
      status: txRes.errors?.length ? '0x0' : '0x1',
      changes: txRes.objectChanges
    }
  }

  _moveCallsFromTxResponse(txRes: SuiTransactionBlockResponse) {
    const txData = txRes.transaction?.data.transaction
    if (txData?.kind === 'ProgrammableTransaction') {
      return txData.transactions.map(tx => {
        if ('MoveCall' in tx) {
          const {
            module,
            function: functionName,
            arguments: _arguments,
            type_arguments: typeArguments,
          } = tx.MoveCall
          const packageName = utils.hexZeroPad(tx.MoveCall.package || '0x', 32)
          return {
            package: packageName,
            target: `${packageName}::${module}::${functionName}`,
            arguments: _arguments.map(arg => {
              if (arg !== 'GasCoin' && 'Input' in arg) {
                const input = txData.inputs[arg.Input]
                if (input.type === 'pure') {
                  if (input.valueType === 'vector<u8>') {
                    return utils.hexlify(<any>input.value)
                  } else {
                    return input.value
                  }
                } else if (input.type === 'object') {
                  return input.objectId
                }
              }
            }),
            typeArguments
          }
        }
      }).filter(Boolean)
    }
  }
}

function _wrapSuiBlock() {
  return
}
