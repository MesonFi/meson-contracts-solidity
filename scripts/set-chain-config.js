const path = require('path')
const fs = require('fs')

const chain = process.env.BLOCKCHAIN_NAME

async function setChainConfig(chain) {
  const template = await fs.promises.readFile(
    path.join(__dirname, 'templates/MesonConfig.sol'),
    'utf8'
  )

  let blockchainName, chainId, coinType
  switch (chain) {
    case 'local':
      blockchainName = 'LocalTest'
      chainId = '0x3'
      coinType = '0x80000001'
      break
    case 'eth':
      blockchainName = 'Ethereum'
      chainId = '0x1'
      coinType = '0x8000003c'
      break
    case 'bsc':
      blockchainName = 'Bitcoin Smart Contract'
      chainId = '0x38'
      coinType = '0x80000207'
      break
    case 'cfx':
      blockchainName = 'Conflux'
      chainId = '0x405'
      coinType = '0x800001f7'
      break
    case 'one':
      blockchainName = 'Harmony'
      chainId = '1'
      coinType = '0x800003ff'
      break
    default:
      throw new Error(`Invalid chain: ${chain}`)
  }

  const config = template
    .replace('CONFIG_BLOCKCHAIN_NAME', blockchainName)
    .replace('CONFIG_CHAIN_ID', chainId)
    .replace('CONFIG_COIN_TYPE', coinType)

  await fs.promises.writeFile(
    path.join(__dirname, '../contracts/MesonConfig.sol'),
    config
  )
}

setChainConfig(chain)
