import { utils, Wallet, BytesLike } from 'ethers'

const { id, keccak256, defaultAbiCoder } = utils

const SWAP_REQUEST_TYPEHASH = id('SwapRequest(uint256 expireTs,bytes inToken,uint256 amount,bytes4 outChain,bytes outToken,bytes recipient)')

export interface SwapRequestData {
  expireTs: number,
  inChain: BytesLike,
  inToken: BytesLike,
  amount: string,
  outChain: BytesLike,
  outToken: BytesLike,
  recipient: BytesLike,
}

export interface PartialSwapRequest {
  inToken: BytesLike,
  amount: string,
  outToken: BytesLike,
  recipient: BytesLike,
}

export class SwapRequest implements SwapRequestData {
  readonly expireTs: number
  readonly inChain: BytesLike
  readonly inToken: BytesLike
  readonly amount: string
  readonly outChain: BytesLike
  readonly outToken: BytesLike
  readonly recipient: BytesLike

  private _encoded: BytesLike = ''
  private _swapId: BytesLike = ''

  constructor(req: SwapRequestData) {
    this.expireTs = req.expireTs
    this.inChain = req.inChain
    this.inToken = req.inToken
    this.amount = req.amount
    this.outChain = req.outChain
    this.outToken = req.outToken
    this.recipient = req.recipient
  }

  encode(): BytesLike {
    if (!this._encoded) {
      this._encoded = defaultAbiCoder.encode(
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
    return this._encoded
  }

  id (): BytesLike {
    if (!this._swapId) {
      this._swapId = keccak256(this.encode())
    }
    return this._swapId
  }

  toObject () {
    return {
      expireTs: this.expireTs,
      inChain: this.inChain,
      inToken: this.inToken,
      amount: this.amount,
      outChain: this.outChain,
      outToken: this.outToken,
      recipient: this.recipient,
      encoded: this.encode(),
    }
  }

  serialize () {
    return JSON.stringify(this.toObject())
  }
}
