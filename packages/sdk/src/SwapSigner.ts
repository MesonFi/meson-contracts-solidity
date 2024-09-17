import { Wallet, utils } from 'ethers'
import { HDNode } from '@ethersproject/hdnode'
import TronWeb from 'tronweb'
import bs58 from 'bs58'
import { helpers, config } from '@ckb-lumos/lumos'

import { bitcoin } from './adaptors'

const NOTICE_SIGN_REQUEST = 'Sign to request a swap on Meson'
const NOTICE_SIGN_RELEASE = 'Sign to release a swap on Meson'
const NOTICE_TESTNET_SIGN_REQUEST = 'Sign to request a swap on Meson (Testnet)'
const NOTICE_TESTNET_SIGN_RELEASE = 'Sign to release a swap on Meson (Testnet)'

export type CompactSignature = string

const nonTyped = (encoded: string) => parseInt(encoded[15], 16) >= 8
const fromTron = (encoded: string) => encoded.substring(60, 64) === '00c3'
const toTron = (encoded: string) => encoded.substring(54, 58) === '00c3'
export const clipRecipient = (recipient: string, encoded: string) => {
  const chain = encoded.substring(54, 58)
  if (chain === '0000') {
    // to bitcoin
    if (utils.isAddress(recipient)) {
      return recipient
    } else {
      const parsed = bitcoin.parseAddress(recipient)
      if (!parsed) {
        throw new Error('Invalid bitcoin address')
      }
      return parsed.hex.substring(0, 42)
    }
  } else if (chain === '00c3') {
    // to tron
    return `0x${TronWeb.address.toHex(recipient).substring(2)}`
  } else if (chain === '01f5') {
    // to solana
    if (utils.isHexString(recipient)) {
      return recipient
    } else {
      return utils.hexlify(bs58.decode(recipient)).substring(0, 42)
    }
  } else if (['027d', '0310', '232c'].includes(chain)) {
    // to aptos, sui, starknet
    if (utils.isAddress(recipient)) {
      return recipient
    } else {
      return utils.hexZeroPad(recipient, 32).substring(0, 42)
    }
  } else if (chain === '0135') {
    // to ckb
    if (utils.isAddress(recipient)) {
      return recipient
    } else {
      const lockScript = helpers.parseAddress(recipient, {
        config: recipient.startsWith('ckb') ? config.MAINNET : config.TESTNET
      })
      if (!lockScript.args.startsWith('0x0001')) {
        throw new Error('Recipient not supported. Please enter a JoyID address.')
      }
      return lockScript.args.replace('0x0001', '0x')
    }
  } else {
    // to eth
    return recipient
  }
}
const noticeRecipient = (encoded: string) => toTron(encoded) ? 'Recipient (tron address in hex format)' : 'Recipient'

export class SwapSigner {
  readonly signer: any

  constructor() {}

  getAddress(encoded?: string): string {
    throw new Error('Not implemented')
  }

  async signSwapRequest(encoded: string, testnet?: boolean): Promise<CompactSignature> {
    throw new Error('Not implemented')
  }

  async signSwapRelease(encoded: string, recipient: string, testnet?: boolean): Promise<CompactSignature> {
    throw new Error('Not implemented')
  }

  async signWithdraw(encoded: string, recipient: string): Promise<CompactSignature> {
    throw new Error('Not implemented')
  }

  static prehashRequest(encoded: string, testnet?: boolean): string {
    if (fromTron(encoded)) {
      const header = nonTyped(encoded) ? '\x19TRON Signed Message:\n33\n' : '\x19TRON Signed Message:\n32\n'
      return utils.solidityPack(['string', 'bytes32'], [header, encoded])
    } else if (nonTyped(encoded)) {
      const header = '\x19Ethereum Signed Message:\n32'
      return utils.solidityPack(['string', 'bytes32'], [header, encoded])
    }
    const notice = testnet ? NOTICE_TESTNET_SIGN_REQUEST : NOTICE_SIGN_REQUEST
    const typeHash = utils.solidityKeccak256(['string'], [`bytes32 ${notice}`])
    return utils.solidityPack(['bytes32', 'bytes32'], [typeHash, utils.keccak256(encoded)])
  }

  static hashRequest(encoded: string, testnet?: boolean): string {
    return utils.keccak256(SwapSigner.prehashRequest(encoded, testnet))
  }

  static prehashRelease(encoded: string, recipient: string, testnet?: boolean): string {
    if (fromTron(encoded)) {
      const header = nonTyped(encoded) ? '\x19TRON Signed Message:\n53\n' : '\x19TRON Signed Message:\n32\n'
      return utils.solidityPack(['string', 'bytes32', 'address'], [header, encoded, clipRecipient(recipient, encoded)])
    } else if (nonTyped(encoded)) {
      const header = '\x19Ethereum Signed Message:\n52'
      return utils.solidityPack(['string', 'bytes32', 'address'], [header, encoded, clipRecipient(recipient, encoded)])
    }
    const notice = testnet ? NOTICE_TESTNET_SIGN_RELEASE : NOTICE_SIGN_RELEASE
    const typeHash = utils.solidityKeccak256(['string', 'string'], [`bytes32 ${notice}`, `address ${noticeRecipient(encoded)}`])
    const valueHash = utils.solidityKeccak256(['bytes32', 'address'], [encoded, clipRecipient(recipient, encoded)])
    return utils.solidityPack(['bytes32', 'bytes32'], [typeHash, valueHash])
  }

  static hashRelease(encoded: string, recipient: string, testnet?: boolean): string {
    return utils.keccak256(SwapSigner.prehashRelease(encoded, recipient, testnet))
  }

  static hashWithdraw(encoded: string, recipient: string): string {
    return utils.keccak256(utils.solidityPack(['bytes32', 'address'], [encoded, clipRecipient(recipient, encoded)]))
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

  async signSwapRequest(encoded: string, testnet?: boolean): Promise<CompactSignature> {
    const digest = SwapSigner.hashRequest(encoded, testnet)
    const signature = await this.wallet._signingKey().signDigest(digest)
    return signature.compact
  }

  async signSwapRelease(encoded: string, recipient: string, testnet?: boolean): Promise<CompactSignature> {
    const digest = SwapSigner.hashRelease(encoded, recipient, testnet)
    const signature = await this.wallet._signingKey().signDigest(digest)
    return signature.compact
  }

  async signWithdraw(encoded: string, recipient: string): Promise<CompactSignature> {
    const digest = SwapSigner.hashWithdraw(encoded, recipient)
    const signature = await this.wallet._signingKey().signDigest(digest)
    return signature.compact
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

  async signSwapRequest(encoded: string, testnet?: boolean): Promise<CompactSignature> {
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
    return utils.splitSignature(signature).compact
  }

  async signSwapRelease(encoded: string, recipient: string, testnet?: boolean): Promise<CompactSignature> {
    let signature
    if (fromTron(encoded)) {
      const message = utils.solidityPack(['bytes32', 'address'], [encoded, clipRecipient(recipient, encoded)]).replace('0x', '0x0a')
      signature = await this.remoteSigner.signMessage(message)
    } else if (nonTyped(encoded)) {
      const message = utils.solidityPack(['bytes32', 'address'], [encoded, clipRecipient(recipient, encoded)])
      signature = await this.remoteSigner.signMessage(message)
    } else {
      const notice = testnet ? NOTICE_TESTNET_SIGN_RELEASE : NOTICE_SIGN_RELEASE
      const data = [
        { type: 'bytes32', name: notice, value: encoded },
        { type: 'address', name: noticeRecipient(encoded), value: clipRecipient(recipient, encoded) }
      ]
      signature = await this.remoteSigner.signTypedData(data)
    }
    return utils.splitSignature(signature).compact
  }
}

export class NonEcdsaRemoteSwapSigner extends SwapSigner {
  readonly remoteSigner: RemoteSigner
  #currentInitiator: string
  #initiatorSwapSigners: Map<string, EthersWalletSwapSigner>

  constructor (remoteSigner: RemoteSigner) {
    super()
    this.remoteSigner = remoteSigner
    this.#currentInitiator = ''
    this.#initiatorSwapSigners = new Map()
  }

  getAddress(encoded = ''): string {
    if (encoded) {
      return this.#initiatorSwapSigners.get(encoded)?.getAddress()
    } else {
      return this.#currentInitiator
    }
  }

  private _swapSignerFromSeed(seed: string) {
    const hdNode = HDNode.fromSeed(seed)
    const wallet = new Wallet(hdNode)
    return new EthersWalletSwapSigner(wallet)
  }

  private _swapMessage(encoded: string) {
    return `Sign for a swap on Meson:\n${encoded}`
  }

  async signSwapRequest(encoded: string, testnet?: boolean): Promise<CompactSignature> {
    const signature = await this.remoteSigner.signMessage(this._swapMessage(encoded))
    const swapSigner = this._swapSignerFromSeed(signature)
    this.#initiatorSwapSigners.set(encoded, swapSigner)
    this.#currentInitiator = swapSigner.getAddress()
    return await swapSigner.signSwapRequest(encoded, testnet)
  }

  async signSwapRelease(encoded: string, recipient: string, testnet?: boolean): Promise<CompactSignature> {
    if (!this.#initiatorSwapSigners.has(encoded)) {
      const signature = await this.remoteSigner.signMessage(this._swapMessage(encoded))
      const swapSigner = this._swapSignerFromSeed(signature)
      this.#initiatorSwapSigners.set(encoded, swapSigner)
      this.#currentInitiator = swapSigner.getAddress()
    }
    return await this.#initiatorSwapSigners.get(encoded).signSwapRelease(encoded, recipient, testnet)
  }

  async signWithdraw(encoded: string, recipient: string): Promise<CompactSignature> {
    if (!this.#initiatorSwapSigners.has(encoded)) {
      const signature = await this.remoteSigner.signMessage(this._swapMessage(encoded))
      const swapSigner = this._swapSignerFromSeed(signature)
      this.#initiatorSwapSigners.set(encoded, swapSigner)
      this.#currentInitiator = swapSigner.getAddress()
    }
    return await this.#initiatorSwapSigners.get(encoded).signWithdraw(encoded, recipient)
  }
}
