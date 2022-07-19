import type { Signer } from '@ethersproject/abstract-signer'
import {
  StaticJsonRpcProvider,
  WebSocketProvider,
  FallbackProvider,
  type Provider
} from '@ethersproject/providers'
import { ErrorCode } from '@ethersproject/logger'
import { Contract } from '@ethersproject/contracts'

import TronWeb from 'tronweb'

import {
  MesonClient,
  MesonClientTron,
  TronContract,
  Swap,
  PostedSwapStatus,
  LockedSwapStatus
} from '@mesonfi/sdk'
import { Meson } from '@mesonfi/contract-abis'

import testnets from './testnets.json'
import mainnets from './mainnets.json'

class RpcFallbackProvider extends FallbackProvider {
  async send(method, params) {
    for await (const c of this.providerConfigs) {
      try {
        return await (c.provider as StaticJsonRpcProvider).send(method, params)
      } catch (e) {
      }
    }
    throw new Error('Send rpc call failed for all providers')
  }
}

class FailsafeStaticJsonRpcProvider extends StaticJsonRpcProvider {
  async perform (method, params) {
    try {
      return await super.perform(method, params)
    } catch (e) {
      if (e.code === ErrorCode.CALL_EXCEPTION) {
        e.code = ErrorCode.SERVER_ERROR
      }
      throw e
    }
  }
}

class FailsafeWebSocketProvider extends WebSocketProvider {
  async perform (method, params) {
    try {
      return await super.perform(method, params)
    } catch (e) {
      if (e.code === ErrorCode.CALL_EXCEPTION) {
        e.code = ErrorCode.SERVER_ERROR
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
    if (!match) {
      return []
    }
    return [...match.tokens, {
      addr: match.uctAddress,
      name: 'USD Coupon Token',
      symbol: 'UCT',
      decimals: 4,
      tokenIndex: 255,
    }]
  }

  getToken(networkId: string, tokenIndex: number): PresetToken {
    const tokens = this.getTokensForNetwork(networkId)
    return tokens.find(t => t.tokenIndex === tokenIndex)
  }

  getClient(id: string, provider: Provider | Signer): MesonClient {
    const network = this.getNetwork(id)
    if (!network) {
      throw new Error(`Unsupported network: ${id}`)
    }
    if (!this._cache.get(id)) {
      let client
      if (id.startsWith('tron')) {
        const instance = new TronContract(network.mesonAddress, Meson.abi, provider)
        client = new MesonClientTron(instance, network.shortSlip44)
      } else {
        const instance = new Contract(network.mesonAddress, Meson.abi, provider)
        client = new MesonClient(instance, network.shortSlip44)
      }
      this._cache.set(id, client)
    }
    return this._cache.get(id)
  }

  clientFromUrl({ id, url = '', ws = null, quorum }): MesonClient {
    const network = this.getNetwork(id)
    if (!network) {
      throw new Error(`Unsupported network: ${id}`)
    }
    if (!this._cache.get(id)) {
      let provider
      const providerNetwork = { name: network.name, chainId: Number(network.chainId) }
      
      if (id.startsWith('tron')) {
        provider = new TronWeb({ fullHost: url })
      } else if (quorum) {
        const fallbacks = quorum.list.map(({ url, ws, priority, stallTimeout, weight }) => {
          const provider = ws
            ? new FailsafeWebSocketProvider(ws, providerNetwork)
            : new FailsafeStaticJsonRpcProvider(url, providerNetwork)
          return { provider, priority, stallTimeout, weight}
        })
        provider = new RpcFallbackProvider(fallbacks, quorum.threshold)
      } else if (ws) {
        provider = new WebSocketProvider(ws, providerNetwork)
      } else if (url.startsWith('ws')) {
        provider = new WebSocketProvider(url, providerNetwork)
      } else {
        provider = new StaticJsonRpcProvider(url, providerNetwork)
      }
      let client
      if (id.startsWith('tron')) {
        const instance = new TronContract(network.mesonAddress, Meson.abi, provider)
        client = new MesonClientTron(instance, network.shortSlip44)
      } else {
        const instance = new Contract(network.mesonAddress, Meson.abi, provider)
        client = new MesonClient(instance, network.shortSlip44)
      }
      this._cache.set(id, client)
    }
    return this._cache.get(id)
  }

  disposeClient(id: string) {
    const client = this._cache.get(id)
    if (client) {
      client.dispose()
      this._cache.delete(id)
    }
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
