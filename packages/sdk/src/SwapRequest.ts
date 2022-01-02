import { _TypedDataEncoder } from '@ethersproject/hash'
import { keccak256 } from '@ethersproject/keccak256'
import { BytesLike } from '@ethersproject/bytes'

export const SWAP_REQUEST_TYPE = {
  SwapRequest: [
    { name: 'expireTs', type: 'uint256' },
    { name: 'inToken', type: 'bytes' },
    { name: 'amount', type: 'uint256' },
    { name: 'outChain', type: 'bytes4' },
    { name: 'outToken', type: 'bytes' },
    { name: 'recipient', type: 'bytes' },
  ]
}

export const SWAP_RELEASE_TYPE = {
  SwapRelease: [{ name: 'swapId', type: 'bytes32' }]
}

export interface SwapRequestData {
  expireTs: number,
  inChain: BytesLike,
  inToken: BytesLike,
  amount: string,
  outChain: BytesLike,
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
      this._encoded = _TypedDataEncoder.from(SWAP_REQUEST_TYPE).encode(this)
    }
    return this._encoded
  }

  toObject() {
    return {
      expireTs: this.expireTs,
      inChain: this.inChain,
      inToken: this.inToken,
      amount: this.amount,
      outChain: this.outChain,
      outToken: this.outToken,
      recipient: this.recipient,
    }
  }

  serialize() {
    return JSON.stringify(this.toObject())
  }
}
