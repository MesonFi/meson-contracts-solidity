const { getWallet } = require('./adaptor')

const { HARDHAT_NETWORK, NETWORK_ID } = process.env

module.exports = function getNetworkWallet(privateKey) {
  let network
  if (HARDHAT_NETWORK) {
    // mainnet
    const mainnets = require('@mesonfi/presets/src/mainnets.json')
    network = mainnets.find(item => item.id === HARDHAT_NETWORK)
  } else {
    // testnet
    const testnets = require('@mesonfi/presets/src/testnets.json')
    const networkId = NETWORK_ID === 'eth' ? 'ropsten' : NETWORK_ID
    network = testnets.find(item => item.id.startsWith(networkId))
    if (!network) {
      throw new Error(`Invalid network: ${networkId}`)
    }
  }

  const wallet = getWallet(network, privateKey)
  return { network, wallet }
}
