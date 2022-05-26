import type { Wallet } from '@ethersproject/wallet'
import { pack } from '@ethersproject/solidity'
import { keccak256 } from '@ethersproject/keccak256'
import TronWeb from 'tronweb'

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
    if (encoded.substring(60, 64) === '00c3') {
      // for Tron
      const header = encoded.substring(14, 16) === 'ff'
        ? '\x19TRON Signed Message:\n33\n'
        : '\x19TRON Signed Message:\n32\n'
      return keccak256(pack(['string', 'bytes32'], [header, encoded]))
    }
    if (encoded.substring(14, 16) === 'ff') {
      // for Ethereum eth_sign
      const header = '\x19Ethereum Signed Message:\n32'
      return keccak256(pack(['string', 'bytes32'], [header, encoded]))
    }
    const notice = testnet ? NOTICE_TESTNET_SIGN_REQUEST : NOTICE_SIGN_REQUEST
    const typeHash = keccak256(pack(['string'], [`bytes32 ${notice}`]))
    return keccak256(pack(
      ['bytes32', 'bytes32'],
      [typeHash, keccak256(encoded)],
    ))
  }

  static getReleaseTypeHash(encoded: string, testnet?: boolean) {
    const notice = testnet ? NOTICE_TESTNET_SIGN_RELEASE : NOTICE_SIGN_RELEASE
    if (encoded.substring(54, 58) === '00c3') {
      return keccak256(pack(['string', 'string'], [`bytes32 ${notice}`, 'bytes21 Recipient (tron address in hex format)']))
    } else {
      return keccak256(pack(['string', 'string'], [`bytes32 ${notice}`, 'address Recipient']))
    }
  }

  static getReleaseValueHash(encoded: string, recipient: string) {
    if (encoded.substring(54, 58) === '00c3') {
      const hexRecipient = TronWeb.address.toHex(recipient)
      return keccak256(pack(['bytes32', 'bytes21'], [encoded, `0x${hexRecipient}`]))
    } else {
      return keccak256(pack(['bytes32', 'address'], [encoded, recipient]))
    }
  }

  static hashRelease(encoded: string, recipient: string, testnet?: boolean): string {
    if (encoded.substring(60, 64) === '00c3') {
      // for Tron
      const header = encoded.substring(14, 16) === 'ff'
        ? '\x19TRON Signed Message:\n53\n'
        : '\x19TRON Signed Message:\n32\n'
      return keccak256(pack(['string', 'bytes32', 'address'], [header, encoded, recipient]))
    }
    if (encoded.substring(14, 16) === 'ff') {
      // for Ethereum eth_sign
      const header = '\x19Ethereum Signed Message:\n32'
      const hash = keccak256(pack(['bytes32', 'address'], [encoded, recipient]))
      return keccak256(pack(['string', 'bytes32'], [header, hash]))
    }
    const typeHash = SwapSigner.getReleaseTypeHash(encoded, testnet)
    const valueHash = SwapSigner.getReleaseValueHash(encoded, recipient)
    return keccak256(pack(['bytes32', 'bytes32'], [typeHash, valueHash]))
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
  signMessage: (data: any) => Promise<string>
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
    if (encoded.substring(60, 64) === '00c3') {
      const signature = await this.remoteSigner.signMessage(encoded.replace('0x', '0x0a'))
      return this._separateSignature(signature)
    }
    if (encoded.substring(14, 16) === 'ff') {
      const signature = await this.remoteSigner.signMessage(encoded)
      return this._separateSignature(signature)
    }
    const notice = testnet ? NOTICE_TESTNET_SIGN_REQUEST : NOTICE_SIGN_REQUEST
    const data = [{ type: 'bytes32', name: notice, value: encoded }]
    const signature = await this.remoteSigner.signTypedData(data)
    return this._separateSignature(signature)
  }

  async signSwapRelease(encoded: string, recipient: string, testnet?: boolean): Promise<Signature> {
    if (encoded.substring(60, 64) === '00c3') {
      const message = pack(['bytes32', 'address'], [encoded, recipient])
      const signature = await this.remoteSigner.signMessage(message.replace('0x', '0x0a'))
      return this._separateSignature(signature)
    }
    if (encoded.substring(14, 16) === 'ff') {
      const hash = keccak256(pack(['bytes32', 'address'], [encoded, recipient]))
      const signature = await this.remoteSigner.signMessage(hash)
      return this._separateSignature(signature)
    }
    const notice = testnet ? NOTICE_TESTNET_SIGN_RELEASE : NOTICE_SIGN_RELEASE
    const data = [
      { type: 'bytes32', name: notice, value: encoded },
    ]
    if (encoded.substring(54, 58) === '00c3') {
      const hexRecipient = TronWeb.address.toHex(recipient)
      data.push({ type: 'bytes21', name: 'Recipient (tron address in hex format)', value: `0x${hexRecipient}` })
    } else {
      data.push({ type: 'address', name: 'Recipient', value: recipient })
    }
    const signature = await this.remoteSigner.signTypedData(data)
    return this._separateSignature(signature)
  }
}
