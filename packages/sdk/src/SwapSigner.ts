import type { Wallet } from '@ethersproject/wallet'
import { pack } from '@ethersproject/solidity'
import { keccak256 } from '@ethersproject/keccak256'

const NOTICE_SIGN_REQUEST = 'Sign to request a swap on Meson'
const NOTICE_SIGN_RELEASE = 'Sign to release a swap on Meson'
const NOTICE_TESTNET_SIGN_REQUEST = 'Sign to request a swap on Meson (Testnet)'
const NOTICE_TESTNET_SIGN_RELEASE = 'Sign to release a swap on Meson (Testnet)'

export type Signature = [string, string, number]

export class SwapSigner {
  readonly signer: any

  constructor() {}

  getAddress(): string {
    throw new Error('Not implemented')
  }

  async signSwapRequest(encoded: string, testnet?: boolean): Promise<Signature> {
    throw new Error('Not implemented')
  }

  async signSwapRelease(encoded: string, recipient: string, testnet?: boolean): Promise<Signature> {
    throw new Error('Not implemented')
  }

  protected _separateSignature(signature: string): Signature {
    const r = '0x' + signature.substring(2, 66)
    const s = '0x' + signature.substring(66, 130)
    const v = parseInt(signature.substring(130, 132), 16)
    return [r, s, v]
  }

  static hashRequest(encoded: string, testnet?: boolean): string {
    const notice = testnet ? NOTICE_TESTNET_SIGN_REQUEST : NOTICE_SIGN_REQUEST
    const domainHash = keccak256(pack(['string'], [`bytes32 ${notice}`]))
    return keccak256(pack(
      ['bytes32', 'bytes32'],
      [domainHash, keccak256(encoded)],
    ))
  }

  static hashRelease(encoded: string, recipient: string, testnet?: boolean): string {
    const notice = testnet ? NOTICE_TESTNET_SIGN_RELEASE : NOTICE_SIGN_RELEASE
    const domainHash = keccak256(pack(
      ['string', 'string'],
      [`bytes32 ${notice}`, 'bytes32 Recipient hash']
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

export class EthersWalletSwapSigner extends SwapSigner {
  readonly wallet: Wallet

  constructor(wallet: Wallet) {
    super()
    this.wallet = wallet
  }

  getAddress(): string {
    return this.wallet.address
  }

  async signSwapRequest(encoded: string, testnet?: boolean): Promise<Signature> {
    const digest = SwapSigner.hashRequest(encoded, testnet)
    const signature = await this.wallet._signingKey().signDigest(digest)
    return [signature.r, signature.s, signature.v]
  }

  async signSwapRelease(encoded: string, recipient: string, testnet?: boolean): Promise<Signature> {
    const digest = SwapSigner.hashRelease(encoded, recipient, testnet)
    const signature = await this.wallet._signingKey().signDigest(digest)
    return [signature.r, signature.s, signature.v]
  }
}


type RemoteSigner = {
  getAddress: () => string
  signTypedData: (data: any) => Promise<string>
}

export class RemoteSwapSigner extends SwapSigner {
  readonly remoteSigner: RemoteSigner

  constructor (remoteSigner: RemoteSigner) {
    super()
    this.remoteSigner = remoteSigner
  }

  getAddress(): string {
    return this.remoteSigner.getAddress()
  }

  async signSwapRequest(encoded: string, testnet?: boolean): Promise<Signature> {
    const notice = testnet ? NOTICE_TESTNET_SIGN_REQUEST : NOTICE_SIGN_REQUEST
    const data = [{ type: 'bytes32', name: notice, value: encoded }]
    const signature = await this.remoteSigner.signTypedData(data)
    return this._separateSignature(signature)
  }

  async signSwapRelease(encoded: string, recipient: string, testnet?: boolean): Promise<Signature> {
    const notice = testnet ? NOTICE_TESTNET_SIGN_RELEASE : NOTICE_SIGN_RELEASE
    const data = [
      { type: 'bytes32', name: notice, value: encoded },
      { type: 'bytes32', name: 'Recipient hash', value: keccak256(recipient) },
    ]
    const signature = await this.remoteSigner.signTypedData(data)
    return this._separateSignature(signature)
  }
}
