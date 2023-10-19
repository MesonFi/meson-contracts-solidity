const path = require('path')
const fs = require('fs')
const testnets = require('@mesonfi/presets/src/testnets.json')
const presets = require('@mesonfi/presets/src/mainnets.json')

module.exports = async function setChainConfig(networkId, testnetMode) {
  if (!networkId) {
    throw new Error(`No networkId specified`)
  }

  const template = await fs.promises.readFile(
    path.join(__dirname, 'MesonConfig.sol'),
    'utf8'
  )

  let network
  if (networkId === 'local') {
    network = { name: 'Local', shortSlip44: '0x0001' }
  } else if (testnetMode) {
    network = testnets.find(item => item.id.startsWith(networkId))
  } else {
    network = presets.find(item => item.id.startsWith(networkId))
  }
  if (!network) {
    throw new Error(`Invalid network: ${networkId}`)
  }

  console.log(`Switch chain config to: ${networkId} ${testnetMode ? 'testnet' : 'mainnet'}`)

  let config = template
    .replace('CONFIG_PROTOCOL_VERSION', 1)
    .replace('CONFIG_BLOCKCHAIN_NAME', `${network.name}`)
    .replace('CONFIG_COIN_TYPE', network.shortSlip44)
    .replace('CONFIG_MIN_CORE_FEE', network.minCoreFee || '500; // min 0.0005 ETH ~ $1')
    .replace('CONFIG_CORE_TOKEN_PRICE_FACTOR', network.coreTokenPriceFactor || '10')

  if (network.shortSlip44 === '0x003c') {
    config = config.replace('CONFIG_LOCK_TIME', '40 minutes')
  } else {
    config = config.replace('CONFIG_LOCK_TIME', '20 minutes')
  }
  
  config = config.replace(/CONFIG_TESTNET_MODE/g, testnetMode ? ' (Testnet)' : '')

  await fs.promises.writeFile(
    path.join(__dirname, '../../contracts/utils/MesonConfig.sol'),
    config
  )

  return network
}
