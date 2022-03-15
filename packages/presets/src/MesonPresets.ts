import type { Provider } from '@ethersproject/providers'
import { Contract as EthersContract } from '@ethersproject/contracts'
import { MesonClient, Swap, PostedSwapStatus, LockedSwapStatus } from '@mesonfi/sdk'
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
  chainId: string,
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

  constructor(networks?: PresetNetwork[]) {
    this._networks = networks
    this._cache = new Map()
  }

  useTestnet(testnet) {
    this._networks = testnet ? testnets : mainnets
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

  getNetworkFromChainId(chainId: string): PresetNetwork {
    const networks = this.getAllNetworks()
    return networks.find(item => item.chainId === chainId)
  }

  getTokensForNetwork(id: string): PresetToken[] {
    const networks = this.getAllNetworks()
    const match = networks.find(item => item.id === id)
    return match?.tokens || []
  }

  getToken(networkId: string, tokenIndex: number): PresetToken {
    const tokens = this.getTokensForNetwork(networkId)
    return tokens[tokenIndex - 1]
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

  getClientFromShortCoinType(shortCoinType: string) {
    const network = this.getNetworkFromShortCoinType(shortCoinType)
    if (!network) {
      throw new Error(`No network for shortCoinType: ${shortCoinType}`)
    }
    if (!this._cache.has(network.id)) {
      throw new Error(`Client ${network.id} not initialized. Call getClient first.`)
    }
    return this._cache.get(network.id)
  }

  async checkSwapStatus(encoded: string, initiator?: string, options: any = {}): Promise<[
    { status: PostedSwapStatus, initiator?: string, provider?: string },
    { status: LockedSwapStatus, initiator?: string, provider?: string, until?: number }?
  ]> {
    const swap = Swap.decode(encoded)
    const fromClient = this.getClientFromShortCoinType(swap.inChain)
    const toClient = this.getClientFromShortCoinType(swap.outChain)

    const posted = await fromClient.getPostedSwap(encoded, initiator, options.blockForInChain)
    if ([
      PostedSwapStatus.NoneOrAfterRunning,
      PostedSwapStatus.Bonded,
      PostedSwapStatus.Executed,
      PostedSwapStatus.ErrorExpiredButBonded
    ].includes(posted.status)) {
      // no need to getLockedSwap in other cases
      try {
        const locked = await toClient.getLockedSwap(encoded, initiator, options.blockForOutChain)
        return [posted, locked]
      } catch {}
    }
    return [posted]
  }
}

export default new MesonPresets()
