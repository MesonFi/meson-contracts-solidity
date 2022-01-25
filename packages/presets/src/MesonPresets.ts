import type { Provider } from '@ethersproject/providers'
import type { SwapRequestData } from '@mesonfi/sdk'

import { Contract as EthersContract } from '@ethersproject/contracts'
import { defaultAbiCoder } from '@ethersproject/abi'
import { keccak256 } from '@ethersproject/keccak256'
import { MesonClient } from '@mesonfi/sdk'
import { Meson } from '@mesonfi/contract-abis'
import mainnets from './mainnets.json'

export interface PresetToken {
  addr: string
  name?: string
  symbol: string
  decimals: number
}

export interface PresetNetwork {
  id: string
  name: string
  chainId?: string
  slip44: string
  extensions?: string[]
  addressFormat: string
  url?: string
  explorer?: string
  mesonAddress: string
  nativeCurrency?: {
    name?: string
    symbol: string
    decimals: number
  }
  tokens: PresetToken[]
}

export class MesonPresets {
  private _networks: PresetNetwork[] | undefined
  private _cache: Map<string, MesonClient>
  private _tokenHashes: Map<string, string>

  constructor(networks?: PresetNetwork[]) {
    this._networks = networks
    this._cache = new Map()
    this._tokenHashes = new Map()
  }

  calcAllTokenHashes(): void {
    const networks = this.getAllNetworks()
    networks.forEach(n => {
      if (n.addressFormat !== 'hex') {
        return
      }
      n.tokens.forEach(t => {
        this._addTokenToHashTable(t.addr)
      })
    })
  }

  private _addTokenToHashTable(address: string): void {
    this._tokenHashes.set(keccak256(address), address)
  }

  getAllNetworks(): PresetNetwork[] {
    return this._networks ?? mainnets
  }

  getNetwork(id: string): PresetNetwork {
    const networks = this.getAllNetworks()
    return networks.find(item => item.id === id)
  }

  getNetworkFromChainId(chainId: string): PresetNetwork {
    const hexChainId = `0x${Number(chainId).toString(16)}`
    const networks = this.getAllNetworks()
    return networks.find(item => item.chainId === hexChainId)
  }

  getNetworkFromCoinType(coinType: string): PresetNetwork {
    const networks = this.getAllNetworks()
    return networks.find(item => item.slip44 === coinType)
  }

  getTokensForNetwork(id: string): PresetToken[] {
    const networks = this.getAllNetworks()
    const match = networks.find(item => item.id === id)
    return match?.tokens || []
  }

  getToken(networkId: string, addr: string): PresetToken {
    const tokens = this.getTokensForNetwork(networkId)
    return tokens.find(token => token.addr.toLowerCase() === addr.toLowerCase())
  }

  getTokenAddrFromHash(hash: string): string {
    return this._tokenHashes.get(hash)
  }

  decodeSwap(encoded: string): SwapRequestData {
    const [inChain, inTokenHash, amount, fee, expireTs, outChain, outTokenHash] =
      defaultAbiCoder.decode(
        ['bytes32', 'bytes32', 'uint128', 'uint48', 'uint48', 'bytes4', 'bytes32'],
        encoded
      )

    const inToken = this.getTokenAddrFromHash(inTokenHash)
    const outToken = this.getTokenAddrFromHash(outTokenHash)

    return { inChain, inToken, amount, fee, expireTs, outChain, outToken }
  }

  getClient(id: string, provider: Provider, Contract = EthersContract): MesonClient {
    const network = this.getNetwork(id)
    if (!network) {
      console.warn(`Unsupported network: ${id}`)
      return
    }
    if (!this._cache.get(id)) {
      const instance = new Contract(network.mesonAddress, Meson.abi, provider)
      const client = new MesonClient(instance, Number(network.chainId), network.slip44)
      this._cache.set(id, client)
    }
    return this._cache.get(id)
  }
}

export default new MesonPresets()
