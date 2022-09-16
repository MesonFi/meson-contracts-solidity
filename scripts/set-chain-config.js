const path = require('path')
const fs = require('fs')
const presets = require('@mesonfi/presets/src/mainnets.json')

const testnetMode = process.env.TESTNET_MODE
const networkId = process.env.NETWORK_ID || process.env.HARDHAT_NETWORK

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
    network = presets.find(item => item.id.startsWith(networkId))
  }
  if (!network) {
    throw new Error(`Invalid network: ${networkId}`)
  }

  let config = template
    .replace('CONFIG_PROTOCOL_VERSION', 1)
    .replace('CONFIG_BLOCKCHAIN_NAME', `${network.name}${testnetMode ? ' Testnet' : ''}`)
    .replace('CONFIG_COIN_TYPE', network.shortSlip44)

  if (network.shortSlip44 === '0x003c') {
    config = config.replace('CONFIG_LOCK_TIME', '40 minutes')
  } else {
    config = config.replace('CONFIG_LOCK_TIME', '20 minutes')
  }
  
  config = config.replace(/CONFIG_TESTNET_MODE/g, testnetMode ? ' (Testnet)' : '')

  await fs.promises.writeFile(
    path.join(__dirname, '../contracts/utils/MesonConfig.sol'),
    config
  )
}

setChainConfig(networkId)
