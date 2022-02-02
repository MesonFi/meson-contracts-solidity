import type { Wallet } from '@ethersproject/wallet'
import { pack } from '@ethersproject/solidity'
import { keccak256 } from '@ethersproject/keccak256'

const NOTICE_SIGN_REQUEST = 'Sign to request a swap on Meson'
const NOTICE_SIGN_RELEASE = 'Sign to release a swap on Meson'

export type Signature = [string, string, number]

export class SwapSigner {
  readonly signer: any

  constructor() {}

  async getAddress(): Promise<string> {
    throw new Error('Not implemented')
  }

  async signSwapRequest(encoded: string): Promise<Signature> {
    throw new Error('Not implemented')
  }

  async signSwapRelease(encoded: string, recipient: string): Promise<Signature> {
    throw new Error('Not implemented')
  }

  protected _separateSignature(signature: string): Signature {
    const r = '0x' + signature.substring(2, 66)
    const s = '0x' + signature.substring(66, 130)
    const v = parseInt(signature.substring(130, 132), 16)
    return [r, s, v]
  }

  static hashRequest(encoded: string): string {
    const domainHash = keccak256(pack(['string'], [`bytes32 ${NOTICE_SIGN_REQUEST}`]))
    return keccak256(pack(
      ['bytes32', 'bytes32'],
      [domainHash, keccak256(encoded)],
    ))
  }

  static hashRelease(encoded: string, recipient: string): string {
    const domainHash = keccak256(pack(
      ['string', 'string'],
      [`bytes32 ${NOTICE_SIGN_RELEASE}`, 'bytes32 Recipient hash']
    ))
    return keccak256(pack(
      ['bytes32', 'bytes32'],
      [
        domainHash,
        keccak256(pack(['bytes32', 'bytes32'], [encoded, keccak256(recipient)])),
      ],
    ))
  }
}

export class JsonRpcSwapSigner extends SwapSigner {
  readonly ethereum: any

  constructor (ethereum: any) {
    super()
    this.ethereum = ethereum
  }

  async getAddress(): Promise<string> {
    return ''
  }

  async signSwapRequest(encoded: string): Promise<Signature> {
    const initiator = await this.getAddress()
    const message = [
      { type: 'bytes32', name: NOTICE_SIGN_REQUEST, value: encoded },
    ]
    const signature = await this.ethereum.request({
      method: 'eth_signTypedData',
      params: [message, initiator],
    })
    return this._separateSignature(signature)
  }

  async signSwapRelease(encoded: string, recipient: string): Promise<Signature> {
    const initiator = await this.getAddress()
    const message = [
      { type: 'bytes32', name: NOTICE_SIGN_REQUEST, value: encoded },
      { type: 'bytes32', name: 'Recipient hash', value: keccak256(recipient) },
    ]
    const signature = await this.ethereum.request({
      method: 'eth_signTypedData',
      params: [message, initiator],
    })
    return this._separateSignature(signature)
  }
}

export class EthersWalletSwapSigner extends SwapSigner {
  readonly wallet: Wallet

  constructor(wallet: Wallet) {
    super()
    this.wallet = wallet
  }

  async getAddress(): Promise<string> {
    return this.wallet.address
  }

  async signSwapRequest(encoded: string): Promise<Signature> {
    const digest = SwapSigner.hashRequest(encoded)
    const signature = await this.wallet._signingKey().signDigest(digest)
    return [signature.r, signature.s, signature.v]
  }

  async signSwapRelease(encoded: string, recipient: string): Promise<Signature> {
    const digest = SwapSigner.hashRelease(encoded, recipient)
    const signature = await this.wallet._signingKey().signDigest(digest)
    return [signature.r, signature.s, signature.v]
  }
}
