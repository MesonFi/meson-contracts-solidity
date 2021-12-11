const path = require('path')
const fs = require('fs')

const chain = process.env.BLOCKCHAIN_NAME

async function setChainConfig(chain) {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'templates/MesonConfig.sol'),
    'utf8'
  )

  let blockchainName, coinType
  switch (chain) {
    case 'local':
      blockchainName = 'LocalTest'
      coinType = '0x80000001'
      break
    case 'eth':
      blockchainName = 'Ethereum'
      coinType = '0x8000003c'
      break
    case 'bsc':
      blockchainName = 'Bitcoin Smart Contract'
      coinType = '0x80000207'
      break
    case 'cfx':
      blockchainName = 'Conflux'
      coinType = '0x800001f7'
      break
    case 'one':
      blockchainName = 'Harmony'
      coinType = '0x800003ff'
      break
    default:
      throw new Error(`Invalid chain: ${chain}`)
  }

  const config = template
    .replace('CONFIG_BLOCKCHAIN_NAME', blockchainName)
    .replace('CONFIG_COIN_TYPE', coinType)

  await fs.promises.writeFile(
    path.join(__dirname, '../contracts/MesonConfig.sol'),
    config
  )
}

setChainConfig(chain)
