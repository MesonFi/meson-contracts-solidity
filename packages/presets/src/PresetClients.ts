import { Contract as EthersContract } from '@ethersproject/contracts'
import { MesonClient } from '@meson/sdk'
import { Meson } from '@meson/contract-abis'

import mainnets from './mainnets.json'
import testnets from './testnets.json'

const presets = [...mainnets, ...testnets]

export default class PresetClients {
  private _cache: Map<string, MesonClient>

  constructor () {
    this._cache = new Map()
  }

  getClient (id, Contract = EthersContract) {
    const match = presets.find(item => item.id === id)
    if (!match) {
      console.warn(`Unsupported network: ${id}`)
      return
    }
    if (!this._cache.get(id)) {
      const instance = new Contract(match.mesonAddress, Meson.abi)
      const client = new MesonClient(instance, Number(match.chainId), match.slip44)
      this._cache.set(id, client)
    }
    return this._cache.get(id)
  }
}
