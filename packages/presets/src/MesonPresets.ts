import { Contract as EthersContract } from '@ethersproject/contracts'
import { defaultAbiCoder } from '@ethersproject/abi'
import { keccak256 } from '@ethersproject/keccak256'
import { MesonClient } from '@mesonfi/sdk'
import { Meson } from '@mesonfi/contract-abis'

import mainnets from './mainnets.json'
import testnets from './testnets.json'

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
  private _useTestnet: boolean
  private _cache: Map<string, MesonClient>
  private _tokenHashes: Map<string, string>

  constructor () {
    this._useTestnet = false
    this._cache = new Map()
    this._tokenHashes = new Map()
  }

  useTestnet(v) {
    this._useTestnet = v
  }

  calcAllTokenHashes() {
    const networks = this.getAllNetworks()
    networks.forEach(n => {
      if (n.addressFormat !== 'hex') {
        return
      }
      n.tokens.forEach(t => {
        this._addTokenToHashTable(t.addr)
      })
    })
    console.log(this._tokenHashes.entries())
  }

  _addTokenToHashTable (address) {
    this._tokenHashes.set(keccak256(address), address)
  }

  getAllNetworks (): PresetNetwork[] {
    return this._useTestnet ? testnets : mainnets
  }

  getNetwork (id) {
    const networks = this.getAllNetworks()
    return networks.find(item => item.id === id)
  }

  getNetworkFromChainId (chainId) {
    const hexChainId = `0x${Number(chainId).toString(16)}`
    const networks = this.getAllNetworks()
    return networks.find(item => item.chainId === hexChainId)
  }

  getNetworkFromCoinType (coinType) {
    const networks = this.getAllNetworks()
    return networks.find(item => item.slip44 === coinType)
  }

  getTokensForNetwork (id) {
    const networks = this.getAllNetworks()
    const match = networks.find(item => item.id === id)
    return match?.tokens || []
  }

  getToken (networkId, addr) {
    const tokens = this.getTokensForNetwork(networkId)
    return tokens.find(token => token.addr.toLowerCase() === addr.toLowerCase())
  }

  getTokenFromHash (hash) {
    return this._tokenHashes.get(hash)
  }

  decodeSwap (encoded: string) {
    const [_, inTokenHash, amount, fee, expireTs, outChain, outTokenHash] =
      defaultAbiCoder.decode(
        ['bytes32', 'bytes32', 'uint128', 'uint48', 'uint48', 'bytes4', 'bytes32'],
        encoded
      )
    
    const inToken = this.getTokenFromHash(inTokenHash)
    const outToken = this.getTokenFromHash(outTokenHash)
    
    return { inToken, amount, fee, expireTs, outChain, outToken }
  }

  getClient (id, provider, Contract = EthersContract) {
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
