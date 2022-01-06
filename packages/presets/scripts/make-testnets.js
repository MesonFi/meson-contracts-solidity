const chains = require('./chains.json')

const SELECTED_CHAIN_IDS = [3, 97, 80001, 4002, 43113, 1666700000]

const SLIP44 = {
  3: 60,
  97: 714,
  80001: 966,
  4002: 1007,
  43113: 9000,
  1666700000: 1023
}

const selected = chains.filter(item => SELECTED_CHAIN_IDS.indexOf(item.chainId) > -1)


const presets = selected.map(chain => {
  const explorer = chain.explorers && chain.explorers[0] || {}
  const slip44 = chain.slip44 || SLIP44[chain.chainId]
  return {
    id: chain.chain.toLowerCase() + '-testnet',
    name: chain.name,
    alias: chain.shortName,
    chainId: '0x' + Number(chain.chainId).toString(16),
    slip44: '0x' + Number(0x80000000 + slip44).toString(16),
    extensions: explorer.standard === 'EIP3091' ? ['metamask'] : [],
    addressFormat: explorer.standard === 'EIP3091' ? 'hex' : 'unknown',
    url: chain.rpc[0],
    explorer: explorer.url,
    nativeCurrency: chain.nativeCurrency,
    mesonAddress: '',
    tokens: [],
  }
})

console.log(JSON.stringify(presets, null, 2))