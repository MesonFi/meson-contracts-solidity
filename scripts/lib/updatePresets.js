const path = require('path')
const fs = require('fs')

module.exports = function updatePresets (network) {
  const mainnets = require('@mesonfi/presets/src/mainnets.json')
  let index = mainnets.findIndex(item => item.id === network.id)
  if (index > -1) {
    // mainnet
    mainnets.splice(index, 1, network)
    const mainnetsPath = path.join(__dirname, '../../packages/presets/src/mainnets.json')
    fs.writeFileSync(mainnetsPath, JSON.stringify(mainnets, null, 2))
    return
  }

  // testnet
  const testnets = require('@mesonfi/presets/src/testnets.json')
  index = testnets.findIndex(item => item.id === network.id)
  if (index === -1) {
    throw new Error(`Invalid network: ${networkId}`)
  }
  testnets.splice(index, 1, network)
  const testnetsPath = path.join(__dirname, '../../packages/presets/src/testnets.json')
  fs.writeFileSync(testnetsPath, JSON.stringify(testnets, null, 2))
}
