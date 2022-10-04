import { BigNumber, utils } from 'ethers'
import TronWeb from 'tronweb'

export function getWallet(privateKey, tronWeb) {
  const newTronWeb = new TronWeb({
    fullHost: tronWeb.fullNode.host,
    privateKey
  })
  return _polyfillProvider(newTronWeb)
}

export function getContract(address, abi, tronWeb) {
  return new Proxy(tronWeb.contract(abi, address), {
    get(target, prop: string) {
      if (prop === 'address') {
        return TronWeb.address.fromHex(target.address)
      } else if (prop === 'provider') {
        return _polyfillProvider(tronWeb)
      } else if (prop === 'signer') {
        if (!tronWeb.defaultAddress) {
          throw new Error(`TronWeb instance doesn't have a signer.`)
        }
        return tronWeb
      } else if (prop === 'interface') {
        return new utils.Interface(target.abi)
      } else if (['queryFilter', 'on', 'removeAllListeners'].includes(prop)) {
        return () => {}
      } else if (prop === 'connect') {
        return tronWeb => getContract(address, abi, tronWeb)
      } else if (prop === 'filters') {
        throw new Error('TronContract.filters not implemented')
      }
      const method = target.methodInstances[prop]
      if (method?.abi?.type === 'function') {
        if (['view', 'pure'].includes(method.abi.stateMutability)) {
          return async (...args) => {
            let overrides
            if (args.length > method.abi.inputs.length) {
              overrides = args.pop()
            }
            return await target[prop](...args).call(overrides)
          }
        } else {
          return async (...args) => {
            let overrides
            if (args.length > method.abi.inputs.length) {
              overrides = args.pop()
            }
            const txID = await target[prop](...args).send(overrides)
            let tx
            while (!tx) {
              try {
                tx = await tronWeb.trx.getTransaction(txID)
              } catch {
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
            }
            tx.wait = () => new Promise(resolve => {
              const h = setInterval(async () => {
                let info
                try {
                  info = await tronWeb.trx.getUnconfirmedTransactionInfo(txID)
                } catch {}
                if (Object.keys(info).length) {
                  clearInterval(h)
                  resolve(info)
                }
              }, 1000)
            })
            return _wrapTronTx(tx)
          }
        }
      }
      return target[prop]
    }
  })
}

function _polyfillProvider(tronWeb) {
  return new Proxy(tronWeb, {
    get(target, prop: string) {
      if (prop === 'getAddress') {
        return async () => target.defaultAddress.base58
      } else if (prop === 'detectNetwork') {
        return async () => target.fullNode.isConnected()
      } else if (prop === 'getBlockNumber') {
        return async () => {
          const latestBlock = await target.trx.getCurrentBlock()
          return latestBlock?.block_header?.raw_data?.number
        }
      } else if (prop === 'getBalance') {
        return async addr => BigNumber.from(await target.trx.getBalance(addr))
      } else if (prop === 'sendTransaction') {
        return async ({ to, value }) => {
          const tx = await target.transactionBuilder.sendTrx(to, value.toString())
          const signed = await target.trx.sign(tx)
          const receipt = await target.trx.sendRawTransaction(signed)
          console.log(receipt)
        }
      } else if (prop === 'send') {
        return _polyfillRpc(target.trx)
      } else if (['on', 'off', 'removeAllListeners'].includes(prop)) {
        return () => {}
      }
      return target[prop]
    }
  })
}

function _polyfillRpc(trx) {
  return async (method, params) => {
    if (method === 'eth_getBlockByNumber') {
      if (params[0] === 'latest') {
        return _wrapTronBlock(await trx.getCurrentBlock())
      } else {
        console.warn(`Tron provider: 'eth_getBlockByNumber' unsupported`)
        return
      }
    } else if (method === 'eth_getBlockByHash') {
      return _wrapTronBlock(await trx.getBlockByHash(params[0]))
    } else if (method === 'eth_getTransactionByHash') {
      return _wrapTronTx(await trx.getTransaction(params[0]))
    } else if (method === 'eth_getTransactionReceipt') {
      return _wrapTronReceipt(await trx.getUnconfirmedTransactionInfo(params[0]))
    }
    throw new Error(`Tron provider: '${method}' unsupported`)
  }
}

function _wrapTronBlock(raw) {
  return {
    hash: raw.blockID,
    parentHash: raw.block_header.raw_data.parentHash,
    number: raw.block_header.raw_data.number,
    timestamp: Math.floor(raw.block_header.raw_data.timestamp / 1000).toString(),
    transactions: raw.transactions?.map(_wrapTronTx) || []
  }
}

function _wrapTronReceipt(raw) {
  return {
    status: raw.receipt?.result === 'SUCCESS' ? '1' : '0',
    blockNumber: raw.blockNumber,
    timestamp: Math.floor(raw.blockTimeStamp / 1000).toString()
  }
}

function _wrapTronTx(raw) {
  const {
    owner_address: from, // hex
    contract_address: to, // hex
    data,
  } = raw.raw_data?.contract[0]?.parameter?.value || {}

  return {
    blockHash: '',
    blockNumber: '',
    hash: raw.txID,
    from: TronWeb.address.fromHex(from),
    to: TronWeb.address.fromHex(to),
    value: '0',
    input: `0x${data}`,
    timestamp: Math.floor(raw.raw_data?.timestamp / 1000).toString(),
    ...raw,
  }
}
