import { BigNumber, BigNumberish, utils } from 'ethers'
import {
  helpers,
  since,
  type Script,
  type Cell,
} from '@ckb-lumos/lumos'
import { blockchain, hexify, Uint128LE } from '@ckb-lumos/lumos/codec'

import { getSwapId } from '../../utils'
import { Swap } from '../../Swap'
import CkbAdaptor from './CkbAdaptor'
import CkbWallet, { CkbWalletFromJoyId } from './CkbWallet'

export function getWallet(input: string = '', adaptor: CkbAdaptor, Wallet = CkbWallet): CkbWallet {
  if (input.startsWith('0x')) {
    return new Wallet(adaptor, { privateKey: input })
  } else if (input.startsWith('ck')) {
    return new Wallet(adaptor, { address: input })
  }
}

export function getWalletFromJoyId(ext, adaptor: CkbAdaptor): CkbWalletFromJoyId {
  return new CkbWalletFromJoyId(adaptor, ext)
}

const CAPACITY_MIN = 65_0000_0000
const CAPACITY_XUDT = 150_0000_0000
const CAPACITY_SIGLOCK = 230_0000_0000
const CAPACITY_REF_CELL = 150_0000_0000

export function getContract(address: string, abi, adaptor: CkbAdaptor) {
  const metadata = (<any>adaptor.client).metadata || {}
  const pools: [number, string][] = metadata.pools || []
  const lpWallet = new CkbWallet(adaptor, { address: pools[0][1] })

  const _getUdtBalance = async (token: string, addr: string) => {
    const collector = adaptor.indexer.collector({
      lock: helpers.parseAddress(addr, { config: adaptor.network }),
      type: { hashType: 'type', codeHash: metadata.code_hash_xudt, args: token },
    })
    let balance = BigNumber.from(0)
    for await (const cell of collector.collect()) {
      balance = balance.add(Uint128LE.unpack(cell.data).toString())
    }
    return balance
  }

  const _getSupportedTokens = () => {
    const tokens = metadata.tokens || []
    return { tokens: tokens.map(t => t.addr), indexes: tokens.map(t => t.tokenIndex) }
  }

  const _udtTypeFromIndex = (tokenIndex: number): Script => {
    const tokens = metadata.tokens || []
    const token = tokens.find(t => t.tokenIndex === tokenIndex)?.addr
    if (!token) {
      throw new Error(`Unsupported tokenIndex: ${tokenIndex}`)
    }
    return { hashType: 'type', codeHash: metadata.code_hash_xudt, args: token }
  }

  const _generateSigTimeLock = (...items: string[]): Script => ({
    codeHash: address,
    hashType: 'data1',
    args: utils.hexConcat(items)
  })

  const _getPostedSwap = async (encoded: string) => {
    const swap = Swap.decode(encoded)
    const sigTimeLockScript = _generateSigTimeLock(encoded)

    const cells: Cell[] = []
    const collector = adaptor.indexer.collector({
      lock: { script: sigTimeLockScript, argsLen: 98 },
      type: _udtTypeFromIndex(swap.inToken),
    })
    for await (const cell of collector.collect()) {
      cells.push(cell)
      break
    }

    if (!cells.length) {
      return { posted: { exist: false } }
    }

    const args = cells[0].cellOutput.lock.args
    const initiator = '0x' + args.substring(66, 106)
    const receive = '0x' + args.substring(106, 152)
    const refund = '0x' + args.substring(152)
    const posted = {
      initiator,
      poolOwner: adaptor.addressFromPkh(receive),
      fromAddress: adaptor.addressFromPkh(refund),
      exist: true,
    }
    return { posted, postedCell: cells[0] }
  }

  const _getLockedSwap = async (encoded: string, initiator: string) => {
    const swap = Swap.decode(encoded)
    const sigTimeLockScript = _generateSigTimeLock(encoded, initiator)

    const cells: Cell[] = []
    const collector = adaptor.indexer.collector({
      lock: { script: sigTimeLockScript, argsLen: 98 },
      type: _udtTypeFromIndex(swap.outToken),
    })
    for await (const cell of collector.collect()) {
      cells.push(cell)
      break
    }

    if (!cells.length) {
      const swapId = getSwapId(encoded, initiator)
      const refCell = await _findRefCell(swapId)
      if (!refCell) {
        return { locked: { until: 0 } }
      }

      const startTs = Number('0x' + refCell.data.substring(4, 14))
      const dt = Math.floor((swap.expireTs - startTs) / 30)
      if (dt < 0 || dt > 255) {
        return { locked: { until: 0 } }
      }

      const toMatch = dt.toString(16).padStart(2, '0') + swapId.substring(4, 6)
      let dataList = refCell.data.substring(14)
      while (dataList.length > 0) {
        if (dataList.substring(0, 4) === toMatch) {
          return { locked: { until: 0, poolOwner: '0x1' } }
        }
        dataList = dataList.substring(4)
      }
      return { locked: { until: 0 } }
    }

    const args = cells[0].cellOutput.lock.args
    const receive = '0x' + args.substring(106, 152)
    const refund = '0x' + args.substring(152)
    const locked = {
      until: swap.expireTs,
      poolOwner: adaptor.addressFromPkh(refund),
    }

    return { locked, lockedCell: cells[0] }
  }

  const _findRefCell = async (swapId: string) => {
    const shardId = swapId.substring(0, 4)
    const collector = adaptor.indexer.collector({
      type: { hashType: 'data1', codeHash: metadata.code_hash_refcell, args: lpWallet.lockHash },
      order: 'desc',
    })
    for await (const cell of collector.collect()) {
      if (cell.data.startsWith(shardId)) {
        return cell
      }
    }
  }

  const _buildRefCells = async (encoded: string, initiator: string) => {
    const swap = Swap.decode(encoded)
    const swapId = getSwapId(encoded, initiator)
    const shardId = swapId.substring(0, 4)
    const sig = swapId.substring(4, 6)
    const startTs = Math.floor(Date.now() / 30000) * 30 - 300
    const dt = Math.floor((swap.expireTs - startTs) / 30)
    if (dt < 0) {
      throw new Error('Swap expired')
    } else if (dt > 255) {
      throw new Error('Swap expireTs too late')
    }
    const newItem = dt.toString(16).padStart(2, '0') + sig

    const refCell = await _findRefCell(swapId)
    if (refCell) {
      const newData = _updateRefCell(refCell.data, startTs, newItem)
      const cellOutput = {
        ...refCell.cellOutput,
        capacity: '0x' + (CAPACITY_REF_CELL + (newData.length - 2) / 2 * 1e8).toString(16),
      }
      const deltaCapacity = Number(cellOutput.capacity) - Number(refCell.cellOutput.capacity)
      return {
        input: refCell,
        output: { data: newData, cellOutput },
        sinceTs: startTs,
        deltaCapacity,
      }
    }

    const capacity = CAPACITY_REF_CELL + 8 * 1e8
    return {
      input: null,
      output: {
        data: shardId + startTs.toString(16).padStart(10, '0') + newItem,
        cellOutput: {
          capacity: '0x' + capacity.toString(16),
          lock: lpWallet.lockScript,
          type: { hashType: 'data1', codeHash: metadata.code_hash_refcell, args: lpWallet.lockHash },
        },
      },
      sinceTs: startTs,
      deltaCapacity: capacity,
    }
  }

  const _updateRefCell = (inputData: string, outputTs: number, newItem: string) => {
    const shardId = inputData.substring(0, 4)
    const startTs = Number('0x' + inputData.substring(4, 14))
    let dataList = inputData.substring(14)
    const delta = (outputTs - startTs) / 30

    let newDataList = ''
    while (dataList.length > 0) {
      const item = dataList.substring(0, 4)
      const updatedItem = (Number('0x' + item.substring(0, 2)) - delta).toString(16).padStart(2, '0') + item.substring(2)
      if (newItem === updatedItem) {
        throw new Error('Duplicated item in ref cell')
      }
      newDataList += updatedItem
      dataList = dataList.substring(4)
    }
    newDataList += newItem

    return shardId + outputTs.toString(16).padStart(10, '0') + newDataList
  }

  const _collectCell = async (lock: Script, amount: BigNumberish) => {
    const cells = []
    let capacity = BigNumber.from(0)

    if (BigNumber.from(amount).lte(0)) {
      return { cells, capacity }
    }

    for await (const cell of adaptor.indexer.collector({ lock, type: 'empty', data: '0x' }).collect()) {
      capacity = capacity.add(cell.cellOutput.capacity)
      cells.push(cell)
      if (capacity.gte(amount)) {
        break
      }
    }
    if (capacity.lt(amount)) {
      throw new Error('No enough CKB')
    }

    return { cells, capacity }
  }

  const _collectUDTCell = async (lock: Script, udtType: Script, amount: BigNumberish) => {
    const udtCells = []
    let udtAmount = BigNumber.from(0)
    let udtCapacity = BigNumber.from(0)
    for await (const cell of adaptor.indexer.collector({ lock, type: udtType }).collect()) {
      udtAmount = udtAmount.add(Uint128LE.unpack(cell.data).toString())
      udtCapacity = udtCapacity.add(cell.cellOutput.capacity)
      udtCells.push(cell)
      if (udtAmount.gte(amount)) {
        break
      }
    }
    if (udtAmount.lt(amount)) {
      throw new Error('Not enough UDT!')
    }

    return { udtCells, udtAmount, udtCapacity }
  }

  return new Proxy({}, {
    get(target, prop: string) {
      if (prop === 'address') {
        return address
      } else if (prop === 'provider') {
        return adaptor
      } else if (prop === 'signer') {
        if (adaptor instanceof CkbWallet) {
          return adaptor
        }
        throw new Error(`CkbContract doesn't have a signer.`)
      } else if (prop === 'interface') {
        return {
          format: () => abi,
          parseTransaction: tx => {
            const [data, packedWitness] = tx.data.split(':')
            const encodedSwap = data.substring(0, 66)
            const initiator = '0x' + data.substring(66, 106)
            const receive = '0x' + data.substring(106, 152)
            const refund = '0x' + data.substring(152)
            const args: any = { encodedSwap, initiator }

            let name: string
            const swapOut = Swap.decode(encodedSwap).inChain === '0x0135'
            if (packedWitness) {
              const witness = blockchain.WitnessArgs.unpack(packedWitness).lock
              if (witness.startsWith('0x00')) {
                if (swapOut) {
                  name = 'executeSwap'
                  args.recipient = '0x' + witness.substring(132)
                } else {
                  name = 'release'
                }
                const signature = '0x' + witness.substring(4, 132)
                const { r, yParityAndS } = utils.splitSignature(signature)
                args.r = r
                args.yParityAndS = yParityAndS
              } else {
                name = swapOut ? 'cancelSwap' : 'unlock'
              }
            } else if (swapOut) {
              name = 'postSwapFromInitiator'
              args.postingValue = BigNumber.from(initiator + '0000000001')
            } else {
              name = 'lockSwap'
            }

            return { name, args }
          }
        }
      } else if (['queryFilter', 'on', 'removeAllListeners'].includes(prop)) {
        return () => { }
      } else if (prop === 'connect') {
        return (wallet: CkbWallet) => getContract(address, abi, wallet)
      } else if (prop === 'filters') {
        throw new Error('CkbContract.filters not implemented')
      } else if (prop === 'pendingTokenBalance') {
        return async (tokenIndex: number) => {
        }
      }

      let method = abi.find(item => item.name === prop)
      if (method?.type === 'function') {
        if (['view', 'pure'].includes(method.stateMutability)) {
          return async (...args) => {
            let options
            if (args.length > method.inputs.length) {
              options = args.pop()
            }

            // ERC20 like
            if (prop === 'name') {
              // const data = await getMint(adaptor.client, new SolPublicKey(address))
            } else if (prop === 'symbol') {
              // const data = await getMint(adaptor.client, new SolPublicKey(address))
            } else if (prop === 'decimals') {
              return 8 // ccBTC
            } else if (prop === 'balanceOf') {
              return await _getUdtBalance(address, args[0])
            } else if (prop === 'allowance') {
              return BigNumber.from(2).pow(128).sub(1)
            }

            // Meson
            if (prop === 'getShortCoinType') {
              return '0x0135'
            } else if (prop === 'getSupportedTokens') {
              return _getSupportedTokens()
            } else if (prop === 'ownerOfPool') {
              return pools.find(p => p[0] === args[0])?.[1]
            } else if (prop === 'poolOfAuthorizedAddr') {
              return pools.find(p => p[1] === args[0])?.[0]
            } else if (prop === 'poolTokenBalance') {
              const [token, poolOwner] = args
              const balance = await _getUdtBalance(token, poolOwner)
              return balance.div(100) // ccBTC: decimals 8 -> 6
            } else if (prop === 'serviceFeeCollected') {
              return BigNumber.from(0)
            } else if (prop === 'getPostedSwap') {
              return (await _getPostedSwap(args[0])).posted
            } else if (prop === 'getLockedSwap') {
              return (await _getLockedSwap(args[0], args[1])).locked
            }

            throw new Error(`CkbContract read not implemented (${prop})`)
          }
        } else {
          return async (...args) => {
            let options
            if (args.length > method.inputs.length) {
              options = args.pop()
            }
            const signer = <CkbWallet>adaptor
            let txSkeleton = helpers.TransactionSkeleton({ cellProvider: adaptor.indexer })
            let witnessIndex: number

            if (prop === 'transfer') {
              const udtType: Script = { hashType: 'type', codeHash: metadata.code_hash_xudt, args: address }
              const [recipient, amount] = args

              const { udtCells, udtAmount, udtCapacity } = await _collectUDTCell(signer.lockScript, udtType, amount)

              const expectedFee = 500_0000
              const outputCells: Cell[] = [{
                data: hexify(Uint128LE.pack(amount.toString())),
                cellOutput: {
                  capacity: '0x' + CAPACITY_XUDT.toString(16),
                  type: udtType,
                  lock: helpers.parseAddress(recipient, { config: adaptor.network }),
                },
              }]
              let requiredCap = BigNumber.from(CAPACITY_XUDT).add(expectedFee)
              if (udtAmount.gt(amount)) {
                outputCells.push({
                  data: hexify(Uint128LE.pack(udtAmount.sub(amount).toString())),
                  cellOutput: {
                    capacity: '0x' + CAPACITY_XUDT.toString(16),
                    type: udtType,
                    lock: signer.lockScript,
                  },
                })
                requiredCap = requiredCap.add(CAPACITY_XUDT)
              }

              const { cells, capacity } = await _collectCell(signer.lockScript, requiredCap.sub(udtCapacity))

              outputCells.push({
                data: '0x',
                cellOutput: {
                  capacity: udtCapacity.add(capacity).sub(requiredCap).toHexString().replace('0x0', '0x'),
                  lock: signer.lockScript,
                }
              })

              txSkeleton = txSkeleton.update('inputs', inputs => inputs.push(...udtCells).push(...cells))
              txSkeleton = txSkeleton.update('outputs', outputs => outputs.push(...outputCells))

              txSkeleton = txSkeleton.update('cellDeps', cellDeps => cellDeps
                .push({ depType: 'depGroup', outPoint: { txHash: adaptor.network.SCRIPTS.SECP256K1_BLAKE160.TX_HASH, index: '0x0' } })
                .push({ depType: 'code', outPoint: { txHash: metadata.tx_hash_xudt, index: '0x0' } })
              )

              witnessIndex = 0
            } else {
              const swap = Swap.decode(args[0])
              let udtType: Script

              if (prop === 'postSwapFromInitiator' || prop === 'lockSwap') {
                let swapAmount: number
                let sigTimeLockScript: Script
                let refCells
                if (prop === 'postSwapFromInitiator') {
                  const [_, postingValue] = args
                  const initiator = postingValue.substring(0, 42)
                  swapAmount = swap.amount.toNumber() * 100
                  sigTimeLockScript = _generateSigTimeLock(swap.encoded, initiator, lpWallet.pkh, signer.pkh)
                  udtType = _udtTypeFromIndex(swap.inToken)
                } else {
                  const [_, { initiator, recipient }] = args
                  swapAmount = swap.amount.sub(swap.fee).toNumber() * 100

                  const recipientWallet = new CkbWallet(adaptor, { address: recipient })
                  sigTimeLockScript = _generateSigTimeLock(swap.encoded, initiator, recipientWallet.pkh, lpWallet.pkh)
                  udtType = _udtTypeFromIndex(swap.outToken)

                  refCells = await _buildRefCells(swap.encoded, initiator)
                }

                const { udtCells, udtAmount, udtCapacity } = await _collectUDTCell(signer.lockScript, udtType, swapAmount)

                const expectedFee = 500_0000
                const outputCells: Cell[] = [{
                  data: hexify(Uint128LE.pack(swapAmount)),
                  cellOutput: {
                    capacity: '0x' + CAPACITY_SIGLOCK.toString(16),
                    type: udtType,
                    lock: sigTimeLockScript,
                  },
                }]
                let requiredCap = BigNumber.from(CAPACITY_SIGLOCK).add(expectedFee).add(refCells?.deltaCapacity || 0)
                if (udtAmount.gt(swapAmount)) {
                  outputCells.push({
                    data: hexify(Uint128LE.pack(udtAmount.sub(swapAmount).toString())),
                    cellOutput: {
                      capacity: '0x' + CAPACITY_XUDT.toString(16),
                      type: udtType,
                      lock: signer.lockScript,
                    },
                  })
                  requiredCap = requiredCap.add(CAPACITY_XUDT)
                }

                const { cells, capacity } = await _collectCell(signer.lockScript, requiredCap.add(CAPACITY_MIN).sub(udtCapacity))

                outputCells.push({
                  data: '0x',
                  cellOutput: {
                    capacity: udtCapacity.add(capacity).sub(requiredCap).toHexString().replace('0x0', '0x'),
                    lock: signer.lockScript,
                  }
                })

                txSkeleton = txSkeleton.update('inputs', inputs => inputs.push(...udtCells).push(...cells))
                txSkeleton = txSkeleton.update('outputs', outputs => outputs.push(...outputCells))

                if (refCells) {
                  if (refCells.input) {
                    txSkeleton = txSkeleton.update('inputs', inputs => inputs.push(refCells.input))
                  }
                  txSkeleton = txSkeleton.update('outputs', outputs => outputs.push(refCells.output))

                  const inputSince = since.generateSince({ relative: false, type: 'blockTimestamp', value: refCells.sinceTs })
                  txSkeleton = txSkeleton.update('inputSinces', sinces => sinces.set(0, inputSince))
                }

                txSkeleton = txSkeleton.update('cellDeps', cellDeps => cellDeps
                  .push({ depType: 'depGroup', outPoint: { txHash: adaptor.network.SCRIPTS.SECP256K1_BLAKE160.TX_HASH, index: '0x0' } })
                  .push({ depType: 'code', outPoint: { txHash: metadata.tx_hash_refcell, index: '0x0' } })
                  .push({ depType: 'code', outPoint: { txHash: metadata.tx_hash_xudt, index: '0x0' } })
                )

                if (prop === 'postSwapFromInitiator') {
                  txSkeleton = txSkeleton.update('cellDeps', cellDeps => cellDeps
                    .push({ depType: 'depGroup', outPoint: { txHash: metadata.tx_hash_joyid, index: '0x0' } })
                  )
                }

                witnessIndex = 0
              } else if (prop === 'executeSwap' || prop === 'release') {
                const expectedFee = 500_0000

                let cell: Cell
                let outputLock: Script
                let witnessLock: string
                if (prop === 'executeSwap') {
                  const [_, r, yParityAndS, recipient, depositToPool] = args
                  outputLock = lpWallet.lockScript
                  witnessLock = utils.hexConcat(['0x00', r, yParityAndS, recipient])
                  udtType = _udtTypeFromIndex(swap.inToken)

                  const { postedCell } = await _getPostedSwap(swap.encoded)
                  cell = postedCell
                } else {
                  const [_, r, yParityAndS, initiator, recipient] = args
                  const recipientWallet = new CkbWallet(adaptor, { address: recipient })
                  outputLock = recipientWallet.lockScript
                  witnessLock = utils.hexConcat(['0x00', r, yParityAndS, '0x' + recipientWallet.pkh.substring(8)])
                  udtType = _udtTypeFromIndex(swap.outToken)

                  const { lockedCell } = await _getLockedSwap(swap.encoded, initiator)
                  cell = lockedCell
                }

                txSkeleton = txSkeleton.update('inputs', inputs => inputs.push(cell))
                txSkeleton = txSkeleton.update('outputs', outputs => outputs
                  .push({
                    data: cell.data,
                    cellOutput: {
                      capacity: '0x' + CAPACITY_XUDT.toString(16),
                      type: udtType,
                      lock: outputLock,
                    },
                  })
                  .push({
                    data: '0x',
                    cellOutput: {
                      capacity: '0x' + (CAPACITY_SIGLOCK - CAPACITY_XUDT - expectedFee).toString(16),
                      lock: signer.lockScript,
                    },
                  })
                )

                txSkeleton = txSkeleton.update('cellDeps', cellDeps => cellDeps
                  .push({ depType: 'depGroup', outPoint: { txHash: adaptor.network.SCRIPTS.SECP256K1_BLAKE160.TX_HASH, index: '0x0' } })
                  .push({ depType: 'code', outPoint: { txHash: metadata.tx_hash_xudt, index: '0x0' } })
                  .push({ depType: 'code', outPoint: { txHash: metadata.tx_hash_siglock, index: '0x0' } })
                )

                const witness = hexify(blockchain.WitnessArgs.pack({ lock: witnessLock }))
                txSkeleton = txSkeleton.update('witnesses', witnesses => witnesses.set(0, witness))

                witnessIndex = 1
              } else {
                throw new Error(`CkbContract write not implemented (${prop})`)
              }
            }

            const gasWitness = hexify(blockchain.WitnessArgs.pack({ lock: '0x'.padEnd(132, '0') }))
            txSkeleton = txSkeleton.update('witnesses', witnesses => witnesses.set(witnessIndex, gasWitness))

            return await signer.sendTransaction(txSkeleton, witnessIndex)
          }
        }
      }
    }
  })
}

export function formatAddress(addr: string) {
  return addr
}
