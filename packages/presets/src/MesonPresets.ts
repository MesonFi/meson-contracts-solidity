import { providers } from 'ethers'
import { JsonRpcProvider as SuiProvider, Connection as SuiConnection } from '@mysten/sui.js'
import sol from '@solana/web3.js'
import TronWeb from 'tronweb'

import {
  MesonClient,
  Swap,
  PostedSwapStatus,
  LockedSwapStatus,
  adaptors,
} from '@mesonfi/sdk'
import { Meson } from '@mesonfi/contract-abis'

import {
  AptosFallbackClient,
  RpcFallbackProvider,
  FailsafeStaticJsonRpcProvider,
  FailsafeWebSocketProvider
} from './providers'

import testnets from './testnets.json'
import mainnets from './mainnets.json'

import v0_testnets from './v0/testnets.json'
import v0_mainnets from './v0/mainnets.json'

const v0_networks = [...v0_mainnets, ...v0_testnets] as PresetNetwork[]

const ADDRESS_ONE = '0x0000000000000000000000000000000000000001'

export interface PresetToken {
  addr: string
  name?: string
  symbol: string
  decimals: number
  tokenIndex: number
  disabled?: boolean
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
  uctAddress?: string
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
    return (this._networks || mainnets as PresetNetwork[]).filter(n => n.url)
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

  getTokensForNetwork(networkId: string, includeDisabled?: boolean): PresetToken[] {
    const network = this.getNetwork(networkId)
    if (!network) {
      return []
    }
    return network.tokens.filter(t => t.addr && (includeDisabled || !t.disabled))
  }

  getToken(networkId: string, tokenIndex: number): PresetToken {
    const tokens = this.getTokensForNetwork(networkId, true)
    return tokens?.find(t => t.tokenIndex === tokenIndex)
  }

  _getV0Token(networkId: string, tokenIndex: number): PresetToken {
    const network = v0_networks.find(n => n.id === networkId)
    if (!network) {
      return
    }
    if (tokenIndex === 255) {
      return network.uctAddress && {
        addr: network.uctAddress,
        name: 'USD Coupon Token',
        symbol: 'UCT',
        decimals: 4,
        tokenIndex: 255,
      }
    }
    return network.tokens.find(t => t.tokenIndex === tokenIndex)
  }

  _getTokenWithDeprecated(networkId: string, tokenIndex: number, v: string = 'v1') {
    if (v === 'v0') {
      return this._getV0Token(networkId, tokenIndex)
    } else if (v === 'v1_uct') {
      const network = this.getNetwork(networkId)
      return network?.uctAddress && {
        addr: network.uctAddress,
        name: 'USD Coupon Token',
        symbol: 'UCT',
        decimals: 4,
        tokenIndex: 255,
      }
    } else {
      return this.getToken(networkId, tokenIndex)
    }
  }

  getTokenByCategory (networkId: string, category = '') {
    const tokens = this.getTokensForNetwork(networkId)
    return tokens?.find(t => MesonClient.categoryFromSymbol(t.symbol) === category.toLowerCase())
  }

  getTokenCategory(networkId: string, tokenIndex: number) {
    const token = this.getToken(networkId, tokenIndex)
    return MesonClient.categoryFromSymbol(token?.symbol)
  }

  getCoreSymbol(networkId: string) {
    const tokens = this.getTokensForNetwork(networkId)
    return tokens?.find(t => t.addr === ADDRESS_ONE)?.symbol
  }

  getNetworkToken(shortCoinType: string, tokenIndex: number, v: string = 'v1'):
    { network: PresetNetwork; token?: any }
  {
    const network = this.getNetworkFromShortCoinType(shortCoinType)
    if (!network) {
      return
    }
    const token = this._getTokenWithDeprecated(network.id, tokenIndex, v)
    if (!token) {
      return { network }
    }
    return { network, token }
  }

  parseInOutNetworkTokens(encoded: string) {
    if (!encoded) {
      return {}
    }
    const swap = Swap.decode(encoded)
    const from = this.getNetworkToken(swap.inChain, swap.inToken, swap.v(false))
    const to = this.getNetworkToken(swap.outChain, swap.outToken, swap.v(true))
    return { swap, from, to }
  }

  createMesonClient(id: string, client: any): MesonClient {
    const network = this.getNetwork(id)
    if (!network) {
      throw new Error(`Unsupported network: ${id}`)
    }
    this.disposeMesonClient(id)
    const instance = adaptors.getContract(network.mesonAddress, Meson.abi, client)
    const mesonClient = new MesonClient(instance, network.shortSlip44)
    this._cache.set(id, mesonClient)
    return mesonClient
  }

  _getProviderClassAndConstructParams(id: string, urls: string[] = [], opts?) {
    const network = this.getNetwork(id)
    if (!network) {
      throw new Error(`Unsupported network: ${id}`)
    }

    const url = urls[0]

    if (id.startsWith('aptos')) {
      return [AptosFallbackClient, [urls]]
    } else if (id.startsWith('sui')) {
      return [SuiProvider, [new SuiConnection({ fullnode: url })]]
    } else if (id.startsWith('solana')) {
      return [sol.Connection, [url, 'confirmed']]
    } else if (id.startsWith('tron')) {
      return [TronWeb, [{ fullHost: url }]]
    }

    const providerNetwork = { name: network.name, chainId: Number(network.chainId) }
    if (urls.length >= 2) {
      const fallbacks = urls.map(url => {
        let provider
        if (url.startsWith('ws')) {
          if (opts?.WebSocket) {
            const ws = new opts.WebSocket(url)
            provider = new FailsafeWebSocketProvider(ws, providerNetwork)
          } else {
            provider = new FailsafeWebSocketProvider(url, providerNetwork)
          }
        } else {
          provider = new FailsafeStaticJsonRpcProvider(url, providerNetwork)
        }
        return { provider, priority: 1, stallTimeout: 1000, weight: 1 }
      })
      return [RpcFallbackProvider, [fallbacks, opts?.threshold || (urls.length > 2 ? 2 : 1)]]
    }
    
    if (url.startsWith('ws')) {
      if (WebSocket) {
        return [providers.WebSocketProvider, [new WebSocket(url), providerNetwork]]
      } else {
        return [providers.WebSocketProvider, [url, providerNetwork]]
      }
    } else {
      return [providers.StaticJsonRpcProvider, [url, providerNetwork]]
    }
  }

  createNetworkClient(id: string, urls: string[] = [], opts?): providers.Provider {
    const [ProviderClass, constructParams] = this._getProviderClassAndConstructParams(id, urls, opts)
    return new ProviderClass(...constructParams)
  }

  disposeMesonClient(id: string) {
    const mesonClient = this._cache.get(id)
    if (mesonClient) {
      mesonClient.dispose()
      this._cache.delete(id)
    }
  }

  getMesonClientFromShortCoinType(shortCoinType: string) {
    const network = this.getNetworkFromShortCoinType(shortCoinType)
    if (!network) {
      throw new Error(`No network for shortCoinType: ${shortCoinType}`)
    }
    if (!this._cache.has(network.id)) {
      throw new Error(`Client ${network.id} not initialized. Call createMesonClient first.`)
    }
    return this._cache.get(network.id)
  }

  async checkSwapStatus(encoded: string, initiator?: string, options: any = {}): Promise<[
    { status: PostedSwapStatus, initiator?: string, provider?: string },
    { status: LockedSwapStatus, initiator?: string, provider?: string, until?: number }?
  ]> {
    const swap = Swap.decode(encoded)
    const fromClient = this.getMesonClientFromShortCoinType(swap.inChain)
    const toClient = this.getMesonClientFromShortCoinType(swap.outChain)

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
