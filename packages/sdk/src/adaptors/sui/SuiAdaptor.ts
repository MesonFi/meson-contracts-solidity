import { BigNumber, utils } from 'ethers'
import {
  JsonRpcProvider as SuiProvider,
  type SuiTransactionBlockResponse
} from '@mysten/sui.js'

const mesonAddress = '0x371a30d40fcc357a37d412c4750a57303d58c9482e5f51886e46f7bf774028f3'

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

  async getCode(addr) {
    // TODO
    return
  }

  on () {}
  removeAllListeners () {}

  async send(method, params) {
    if (method === 'eth_getBlockByNumber') {
      if (params[0] === 'latest') {
        return this._getTransactionBlock(mesonAddress)
      } else {
        return
      }
    } else if (method === 'eth_getBlockByHash') {
      if (params[0] === 'n/a') {
        return {}
      }
      return this._getTransactionBlock(mesonAddress, params[0])
    } else if (method === 'eth_getTransactionByHash' || method === 'eth_getTransactionReceipt') {
      return await this.waitForTransaction(params[0])
    }
  }

  async waitForTransaction(digest: string, confirmations?: number, timeout?: number) {
    const txRes = await this.client.getTransactionBlock({ digest, options: { showInput: true } })
    return this._wrapSuiTx(txRes)
  }

  async _getTransactionBlock(digest: string, cursor = null) {
    const result = await this.client.queryTransactionBlocks({
      filter: { InputObject: digest },
      options: { showInput: true },
      limit: 2,
      cursor,
    })
    const txbs = result.data || []
    return {
      hash: txbs[0]?.digest,
      parentHash: result.nextCursor,
      number: '',
      timestamp: Math.floor(Number(txbs[0]?.timestampMs) / 1000).toString(),
      transactions: txbs.map(tx => this._wrapSuiTx(tx))
    }
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
