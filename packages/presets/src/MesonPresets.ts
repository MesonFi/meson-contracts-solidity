import { providers, errors } from 'ethers'
import { AptosClient } from 'aptos'
import TronWeb from 'tronweb'

import {
  MesonClient,
  Swap,
  PostedSwapStatus,
  LockedSwapStatus,
  adaptors,
} from '@mesonfi/sdk'
import { Meson } from '@mesonfi/contract-abis'

import testnets from './testnets.json'
import mainnets from './mainnets.json'

import v0_testnets from './v0/testnets.json'
import v0_mainnets from './v0/mainnets.json'

const v0_networks = [...v0_mainnets, ...v0_testnets] as PresetNetwork[]

class RpcFallbackProvider extends providers.FallbackProvider {
  async send(method, params) {
    for await (const c of this.providerConfigs) {
      try {
        return await (<providers.StaticJsonRpcProvider>c.provider).send(method, params)
      } catch (e) {
      }
    }
    throw new Error('Send rpc call failed for all providers')
  }
}

class FailsafeStaticJsonRpcProvider extends providers.StaticJsonRpcProvider {
  async perform (method, params) {
    try {
      return await super.perform(method, params)
    } catch (e) {
      if (e.code === errors.CALL_EXCEPTION) {
        e.code = errors.SERVER_ERROR
      }
      throw e
    }
  }
}

class FailsafeWebSocketProvider extends providers.WebSocketProvider {
  async perform (method, params) {
    try {
      return await super.perform(method, params)
    } catch (e) {
      if (e.code === errors.CALL_EXCEPTION) {
        e.code = errors.SERVER_ERROR
      }
      throw e
    }
  }
}

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

  getTokensForNetwork(id: string, includeDisabled?: boolean): PresetToken[] {
    const networks = this.getAllNetworks()
    const match = networks.find(item => item.id === id)
    if (!match) {
      return []
    }
    return [
      ...match.tokens.filter(t => includeDisabled || !t.disabled),
      {
        addr: match.uctAddress,
        name: 'USD Coupon Token',
        symbol: 'UCT',
        decimals: 4,
        tokenIndex: 255,
      }
    ].filter(t => t.addr)
  }

  getToken(networkId: string, tokenIndex: number): PresetToken {
    const tokens = this.getTokensForNetwork(networkId, true)
    return tokens?.find(t => t.tokenIndex === tokenIndex)
  }

  getV0Token(networkId: string, tokenIndex: number): PresetToken {
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

  getTokenByCategory (networkId: string, category = '') {
    const tokens = this.getTokensForNetwork(networkId)
    return tokens?.find(t => MesonClient.categoryFromSymbol(t.symbol) === category.toLowerCase())
  }

  getTokenCategory(networkId: string, tokenIndex: number) {
    const token = this.getToken(networkId, tokenIndex)
    return MesonClient.categoryFromSymbol(token?.symbol)
  }

  getNetworkToken(shortCoinType: string, tokenIndex: number, version: number = 1):
    { network: PresetNetwork; token?: any }
  {
    const network = this.getNetworkFromShortCoinType(shortCoinType)
    if (!network) {
      return
    }
    let token
    if (version === 0) {
      token = this.getV0Token(network.id, tokenIndex)
    } else {
      token = this.getToken(network.id, tokenIndex)
    }
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
    const from = this.getNetworkToken(swap.inChain, swap.inToken, swap.version)
    const to = this.getNetworkToken(swap.outChain, swap.outToken, swap.version)
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

  createNetworkClient({ id, url = '', ws = null, quorum }): providers.Provider {
    const network = this.getNetwork(id)
    if (!network) {
      throw new Error(`Unsupported network: ${id}`)
    }
    
    if (id.startsWith('aptos')) {
      return new AptosClient(url) as any
    } else if (id.startsWith('tron')) {
      return new TronWeb({ fullHost: url })
    }
    
    const providerNetwork = { name: network.name, chainId: Number(network.chainId) }
    if (quorum) {
      const fallbacks = quorum.list.map(({ provider: p, url, ws, priority, stallTimeout, weight }) => {
        const provider = p || (ws
          ? new FailsafeWebSocketProvider(ws, providerNetwork)
          : new FailsafeStaticJsonRpcProvider(url, providerNetwork)
        )
        return { provider, priority, stallTimeout, weight }
      })
      return new RpcFallbackProvider(fallbacks, quorum.threshold)
    } else if (ws) {
      return new providers.WebSocketProvider(ws, providerNetwork)
    } else if (url.startsWith('ws')) {
      return new providers.WebSocketProvider(url, providerNetwork)
    } else {
      return new providers.StaticJsonRpcProvider(url, providerNetwork)
    }
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
