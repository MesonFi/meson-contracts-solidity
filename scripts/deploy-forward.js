const getNetworkWallet = require('./lib/getNetworkWallet')
const { deployContract } = require('./lib/deploy')

require('dotenv').config()

const { PRIVATE_KEY } = process.env

async function main() {
  const { wallet } = getNetworkWallet(PRIVATE_KEY)
  console.log('Deploying ForwardTokenContract...')
  await deployContract('ForwardTokenContract', wallet)
}

main()
