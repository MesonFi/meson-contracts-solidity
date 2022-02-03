const path = require('path')
const fs = require('fs')
const presets = require('@mesonfi/presets/src/mainnets.json')

const networkId = process.env.NETWORK_ID

async function setChainConfig(networkId) {
  if (!networkId) {
    throw new Error(`No networkId specified`)
  }

  const template = await fs.promises.readFile(
    path.join(__dirname, 'templates/MesonConfig.sol'),
    'utf8'
  )

  let network
  if (networkId === 'local') {
    network = { name: 'Local', shortSlip44: '0x0001' }
  } else {
    network = presets.find(item => item.id === networkId)
  }
  if (!network) {
    throw new Error(`Invalid network: ${networkId}`)
  }

  const config = template
    .replace('CONFIG_BLOCKCHAIN_NAME', network.name)
    .replace('CONFIG_COIN_TYPE', network.shortSlip44)

  await fs.promises.writeFile(
    path.join(__dirname, '../contracts/MesonConfig.sol'),
    config
  )
}

setChainConfig(networkId)
