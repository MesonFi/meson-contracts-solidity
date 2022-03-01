const path = require('path')
const fs = require('fs')
const presets = require('@mesonfi/presets/src/testnets.json')

const testnetMode = process.env.TESTNET_MODE
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
    network = presets.find(item => item.id.startsWith(networkId))
  }
  if (!network) {
    throw new Error(`Invalid network: ${networkId}`)
  }

  let config = template
    .replace('CONFIG_BLOCKCHAIN_NAME', network.name)
    .replace('CONFIG_COIN_TYPE', network.shortSlip44)

  if (testnetMode) {
    config = config
      .replace(/CONFIG_TESTNET_MODE/g, ' (Testnet)')
      // keccak256("bytes32 Sign to request a swap on Meson (Testnet)")
      .replace('CONFIG_REQUEST_TYPE_HASH', '0x7b521e60f64ab56ff03ddfb26df49be54b20672b7acfffc1adeb256b554ccb25')
      // keccak256("bytes32 Sign to release a swap on Meson (Testnet)" + "address Recipient")
      .replace('CONFIG_RELEASE_TYPE_HASH', '0xd23291d9d999318ac3ed13f43ac8003d6fbd69a4b532aeec9ffad516010a208c')
  } else {
    config = config
      .replace(/CONFIG_TESTNET_MODE/g, '')
      // keccak256("bytes32 Sign to request a swap on Meson")
      .replace('CONFIG_REQUEST_TYPE_HASH', '0x9862d877599564bcd97c37305a7b0fdbe621d9c2a125026f2ad601f754a75abc')
      // keccak256("bytes32 Sign to release a swap on Meson" + "address Recipient")
      .replace('CONFIG_RELEASE_TYPE_HASH', '0x743e50106a7f059b52151dd4ba27a5f6c87b925ddfbdcf1c332e800da4b3df92')
  }

  await fs.promises.writeFile(
    path.join(__dirname, '../contracts/MesonConfig.sol'),
    config
  )
}

setChainConfig(networkId)
