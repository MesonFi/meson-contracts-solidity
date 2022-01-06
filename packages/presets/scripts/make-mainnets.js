const chains = require('./chains.json')

const SELECTED_CHAIN_IDS = [1, 56, 100, 137, 250, 43114, 1666600000]
// conflux 1030

const SLIP44 = {
  250: 1007,
  1666600000: 1023
}

const selected = chains.filter(item => SELECTED_CHAIN_IDS.indexOf(item.chainId) > -1)


const presets = selected.map(chain => {
  const standard = chain.explorers && chain.explorers[0].standard
  const slip44 = chain.slip44 || SLIP44[chain.chainId]
  return {
    id: chain.chain.toLowerCase(),
    name: chain.name,
    alias: chain.shortName,
    chainId: '0x' + Number(chain.chainId).toString(16),
    slip44: '0x' + Number(0x80000000 + slip44).toString(16),
    extensions: standard === 'EIP3091' ? ['metamask'] : [],
    addressFormat: standard === 'EIP3091' ? 'hex' : 'unknown',
    url: chain.rpc[0],
    explorer: chain.explorers[0].url,
    nativeCurrency: chain.nativeCurrency,
    mesonAddress: '',
    tokens: [],
  }
})

console.log(JSON.stringify(presets, null, 2))