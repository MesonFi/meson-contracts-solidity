const path = require('path')
const fs = require('fs')

const { HARDHAT_NETWORK, NETWORK_ID } = process.env

module.exports = function updatePresets (network) {
  if (HARDHAT_NETWORK) {
    // mainnet
    const mainnets = require('@mesonfi/presets/src/mainnets.json')
    const index = mainnets.findIndex(item => item.id === HARDHAT_NETWORK)
    mainnets.splice(index, 1, network)
    const mainnetsPath = path.join(__dirname, '../../../packages/presets/src/mainnets.json')
    fs.writeFileSync(mainnetsPath, JSON.stringify(mainnets, null, 2))
  } else {
    // testnet
    const testnets = require('@mesonfi/presets/src/testnets.json')
    const networkId = NETWORK_ID === 'eth' ? 'ropsten' : NETWORK_ID
    const index = testnets.findIndex(item => item.id.startsWith(networkId))
    if (index === -1) {
      throw new Error(`Invalid network: ${networkId}`)
    }
    testnets.splice(index, 1, network)
    const testnetsPath = path.join(__dirname, '../../../packages/presets/src/testnets.json')
    fs.writeFileSync(testnetsPath, JSON.stringify(testnets, null, 2))
  }
}