import { utils } from 'ethers'

export function timer(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const h = setTimeout(() => {
      clearTimeout(h)
      resolve()
    }, ms)
  })
}

export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    timer(ms).then(() => {
      throw new Error('Time out')
    })
  ])
}

export function getSwapId(encoded: string, initiator: string) {
  const packed = utils.solidityPack(['bytes32', 'address'], [encoded, initiator])
  return utils.keccak256(packed)
}
