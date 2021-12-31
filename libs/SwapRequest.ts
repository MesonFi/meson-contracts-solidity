import { ethers, BytesLike } from 'ethers'

const { id, keccak256, defaultAbiCoder } = ethers.utils

const SWAP_REQUEST_TYPEHASH = id('SwapRequest(uint256 expireTs,bytes inToken,uint256 amount,bytes4 outChain,bytes outToken,bytes recipient)')

export interface SwapRequestData {
  expireTs: number,
  inToken: BytesLike,
  amount: number,
  outChain: BytesLike,
  outToken: BytesLike,
  recipient: BytesLike,
}

interface PartialSwapRequest {
  inToken: BytesLike,
  amount: number,
  outToken: BytesLike,
  recipient: BytesLike,
}

export class SwapRequest implements SwapRequestData {
  readonly expireTs: number
  readonly inToken: BytesLike
  readonly amount: number
  readonly outChain: BytesLike
  readonly outToken: BytesLike
  readonly recipient: BytesLike

  constructor(req: SwapRequestData) {
    this.expireTs = req.expireTs
    this.inToken = req.inToken
    this.amount = req.amount
    this.outChain = req.outChain
    this.outToken = req.outToken
    this.recipient = req.recipient
  }

  static To(outChain: BytesLike, swap: PartialSwapRequest, lockPeriod: number = 3600) {
    return new SwapRequest({
      ...swap,
      outChain,
      expireTs: Date.now() + lockPeriod,
    })
  }

  encode(): BytesLike {
    return defaultAbiCoder.encode(
      ['bytes32', 'uint256', 'bytes32', 'uint256', 'bytes4', 'bytes32', 'bytes32'],
      [
        SWAP_REQUEST_TYPEHASH,
        this.expireTs,
        keccak256(this.inToken),
        this.amount,
        this.outChain,
        keccak256(this.outToken),
        keccak256(this.recipient)
      ]
    )
  }

  getSwapId (): BytesLike {
    return keccak256(this.encode())
  }
}
