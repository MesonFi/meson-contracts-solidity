import type { Provider } from '@ethersproject/providers'

import { Contract as EthersContract } from '@ethersproject/contracts'
import { keccak256 } from '@ethersproject/keccak256'
import { MesonClient } from '@mesonfi/sdk'
import { Meson } from '@mesonfi/contract-abis'

import testnets from './testnets.json'
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
  slip44: string
  shortSlip44: string
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

  useTestnet(testnet) {
    this._networks = testnet ? testnets : mainnets
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

  getNetworkFromShortCoinType(shortCoinType: string): PresetNetwork {
    const networks = this.getAllNetworks()
    return networks.find(item => item.shortSlip44 === shortCoinType)
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

  getClient(id: string, provider: Provider, Contract = EthersContract): MesonClient {
    const network = this.getNetwork(id)
    if (!network) {
      console.warn(`Unsupported network: ${id}`)
      return
    }
    if (!this._cache.get(id)) {
      const instance = new Contract(network.mesonAddress, Meson.abi, provider)
      const client = new MesonClient(instance, network.shortSlip44)
      this._cache.set(id, client)
    }
    return this._cache.get(id)
  }
}

export default new MesonPresets()
