import { providers } from 'ethers'
import { AptosClient } from 'aptos'
import { Connection as SolConnection } from '@solana/web3.js'
import { RpcProvider as StarkProvider } from 'starknet'
import { SuiClient } from '@mysten/sui.js/client'
import TronWeb from 'tronweb'
import { Provider as ZkProvider } from 'zksync-web3'

import {
  MesonClient,
  Swap,
  PostedSwapStatus,
  LockedSwapStatus,
  adaptors,
  IAdaptor,
} from '@mesonfi/sdk'
import BtcClient from '@mesonfi/sdk/lib/adaptors/bitcoin/BtcClient'

import EthersAdaptor from '@mesonfi/sdk/lib/adaptors/ethers/EthersAdaptor'
import ZksyncAdaptor from '@mesonfi/sdk/lib/adaptors/zksync/ZksyncAdaptor'
import AptosAdaptor from '@mesonfi/sdk/lib/adaptors/aptos/AptosAdaptor'
import BtcAdaptor from '@mesonfi/sdk/lib/adaptors/bitcoin/BtcAdaptor'
import CkbAdaptor from '@mesonfi/sdk/lib/adaptors/ckb/CkbAdaptor'
import SolanaAdaptor from '@mesonfi/sdk/lib/adaptors/solana/SolanaAdaptor'
import StarkAdaptor from '@mesonfi/sdk/lib/adaptors/starknet/StarkAdaptor'
import SuiAdaptor from '@mesonfi/sdk/lib/adaptors/sui/SuiAdaptor'
import TronAdaptor from '@mesonfi/sdk/lib/adaptors/tron/TronAdaptor'

import { Meson } from '@mesonfi/contract-abis'

import { ExtendedCkbClient } from './providers'

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
  disabled?: boolean
  name: string
  chainId: string,
  slip44: string
  shortSlip44: string
  extensions?: string[]
  addressFormat: string
  url?: string
  explorer?: string
  mesonAddress: string
  metadata?: any
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

  getAllNetworks(includeDisabled?: boolean): PresetNetwork[] {
    return (this._networks || mainnets as PresetNetwork[]).filter(n => n.url && (includeDisabled || !n.disabled))
  }

  getNetwork(id: string): PresetNetwork {
    const networks = this.getAllNetworks(true)
    return networks.find(item => item.id === id)
  }

  getNetworkFromShortCoinType(shortCoinType: string): PresetNetwork {
    const networks = this.getAllNetworks(true)
    return networks.find(item => item.shortSlip44 === shortCoinType)
  }

  getNetworkFromChainId(chainId: string): PresetNetwork {
    const networks = this.getAllNetworks(true)
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

  createMesonClient(id: string, adaptor: IAdaptor): MesonClient {
    const network = this.getNetwork(id)
    if (!network) {
      throw new Error(`Unsupported network: ${id}`)
    }
    this.disposeMesonClient(id)
    const instance = adaptors.getContract(network.mesonAddress, Meson.abi, adaptor)
    const mesonClient = new MesonClient(instance, network.shortSlip44)
    this._cache.set(id, mesonClient)
    return mesonClient
  }

  _getProviderClassAndConstructParams(id: string, url: string, opts?) {
    const network = this.getNetwork(id)
    if (!network) {
      throw new Error(`Unsupported network: ${id}`)
    }

    if (id.startsWith('aptos')) {
      return [AptosClient, [url], AptosAdaptor]
    } else if (network.id.startsWith('bitcoin')) {
      return [BtcClient, [url, id === 'bitcoin-signet', network.mesonAddress], BtcAdaptor]
    } else if (id.startsWith('ckb')) {
      return [ExtendedCkbClient, [url, undefined, { ...network.metadata, tokens: network.tokens }], CkbAdaptor]
    } else if (id.startsWith('solana')) {
      return [SolConnection, [url, 'confirmed'], SolanaAdaptor]
    } else if (id.startsWith('starknet')) {
      return [StarkProvider, [{ nodeUrl: url }], StarkAdaptor]
    } else if (id.startsWith('sui')) {
      return [SuiClient, [{ url }], SuiAdaptor]
    } else if (id.startsWith('tron')) {
      return [TronWeb, [{ fullHost: url }], TronAdaptor]
    }

    const providerNetwork = { name: network.name, chainId: Number(network.chainId) }
    if (url.startsWith('ws')) {
      if (opts?.WebSocket) {
        return [providers.WebSocketProvider, [new opts.WebSocket(url), providerNetwork], EthersAdaptor]
      } else {
        return [providers.WebSocketProvider, [url, providerNetwork], EthersAdaptor]
      }
    } else if (id.startsWith('zksync') || id.startsWith('zklink')) {
      return [ZkProvider, [url, providerNetwork], ZksyncAdaptor]
    } else {
      return [providers.StaticJsonRpcProvider, [url, providerNetwork], EthersAdaptor]
    }
  }

  // deprecated
  createNetworkClient(id: string, urls: string[] = [], opts?): providers.Provider {
    const url = [...urls].sort(() => Math.sign(Math.random() - 0.5))[0]
    const [ProviderClass, constructParams] = this._getProviderClassAndConstructParams(id, url, opts)
    return new ProviderClass(...constructParams)
  }

  createAdaptor(id: string, url: string, opts?): IAdaptor {
    const [ProviderClass, constructParams, AdaptorClass] = this._getProviderClassAndConstructParams(id, url, opts)
    return new AdaptorClass(new ProviderClass(...constructParams))
  }

  createFailoverAdaptor(id: string, urls: string[] = [], opts?) {
    return adaptors.getFailoverAdaptor(urls.map(url => this.createAdaptor(id, url, opts)))
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
