import { utils, type Wallet } from 'ethers'
import TronWeb from 'tronweb'

const NOTICE_SIGN_REQUEST = 'Sign to request a swap on Meson'
const NOTICE_SIGN_RELEASE = 'Sign to release a swap on Meson'
const NOTICE_TESTNET_SIGN_REQUEST = 'Sign to request a swap on Meson (Testnet)'
const NOTICE_TESTNET_SIGN_RELEASE = 'Sign to release a swap on Meson (Testnet)'

export type Signature = [string, string, number]

const nonTyped = encoded => parseInt(encoded[15], 16) >= 8
const fromTron = encoded => encoded.substring(60, 64) === '00c3'
const toTron = encoded => encoded.substring(54, 58) === '00c3'
const hexAddress = addr => `0x${TronWeb.address.toHex(addr).substring(2)}`
const noticeRecipient = encoded => toTron(encoded) ? 'Recipient (tron address in hex format)' : 'Recipient'

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
    if (fromTron(encoded)) {
      const header = nonTyped(encoded) ? '\x19TRON Signed Message:\n33\n' : '\x19TRON Signed Message:\n32\n'
      return utils.solidityKeccak256(['string', 'bytes32'], [header, encoded])
    } else if (nonTyped(encoded)) {
      const header = '\x19Ethereum Signed Message:\n32'
      return utils.solidityKeccak256(['string', 'bytes32'], [header, encoded])
    }
    const notice = testnet ? NOTICE_TESTNET_SIGN_REQUEST : NOTICE_SIGN_REQUEST
    const typeHash = utils.solidityKeccak256(['string'], [`bytes32 ${notice}`])
    return utils.solidityKeccak256(['bytes32', 'bytes32'], [typeHash, utils.keccak256(encoded)])
  }

  static hashRelease(encoded: string, recipient: string, testnet?: boolean): string {
    if (fromTron(encoded)) {
      const header = nonTyped(encoded) ? '\x19TRON Signed Message:\n53\n' : '\x19TRON Signed Message:\n32\n'
      return utils.solidityKeccak256(['string', 'bytes32', 'address'], [header, encoded, recipient])
    } else if (nonTyped(encoded)) {
      const header = '\x19Ethereum Signed Message:\n52'
      return utils.solidityKeccak256(['string', 'bytes32', 'address'], [header, encoded, hexAddress(recipient)])
    }
    const notice = testnet ? NOTICE_TESTNET_SIGN_RELEASE : NOTICE_SIGN_RELEASE
    const typeHash = utils.solidityKeccak256(['string', 'string'], [`bytes32 ${notice}`, `address ${noticeRecipient(encoded)}`])
    const valueHash = utils.solidityKeccak256(['bytes32', 'address'], [encoded, hexAddress(recipient)])
    return utils.solidityKeccak256(['bytes32', 'bytes32'], [typeHash, valueHash])
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
    let signature
    if (fromTron(encoded)) {
      signature = await this.remoteSigner.signMessage(encoded.replace('0x', '0x0a'))
    } else if (nonTyped(encoded)) {
      signature = await this.remoteSigner.signMessage(encoded)
    } else {
      const notice = testnet ? NOTICE_TESTNET_SIGN_REQUEST : NOTICE_SIGN_REQUEST
      const data = [{ type: 'bytes32', name: notice, value: encoded }]
      signature = await this.remoteSigner.signTypedData(data)
    }
    return this._separateSignature(signature)
  }

  async signSwapRelease(encoded: string, recipient: string, testnet?: boolean): Promise<Signature> {
    let signature
    if (fromTron(encoded)) {
      const message = utils.solidityPack(['bytes32', 'address'], [encoded, recipient]).replace('0x', '0x0a')
      signature = await this.remoteSigner.signMessage(message)
    } else if (nonTyped(encoded)) {
      const message = utils.solidityPack(['bytes32', 'address'], [encoded, hexAddress(recipient)])
      signature = await this.remoteSigner.signMessage(message)
    } else {
      const notice = testnet ? NOTICE_TESTNET_SIGN_RELEASE : NOTICE_SIGN_RELEASE
      const data = [
        { type: 'bytes32', name: notice, value: encoded },
        { type: 'address', name: noticeRecipient(encoded), value: hexAddress(recipient) }
      ]
      signature = await this.remoteSigner.signTypedData(data)
    }
    return this._separateSignature(signature)
  }
}
