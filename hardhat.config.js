require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-ethers')
require('@typechain/hardhat')
require('@openzeppelin/hardhat-upgrades')
const config = require('./config.json')

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()
  for (const account of accounts) {
    console.log(account.address)
  }
})

task('balance', `Prints an account's balance`)
  .addParam('account', `The account's address`)
  .setAction(async (taskArgs, hre) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.account)
    console.log(hre.ethers.utils.formatEther(balance), 'ETH')
  })

module.exports = {
  solidity: {
    version: config.compilers.solc,
    settings: {
      optimizer: config.compilers.optimizer,
      evmVersion: config.compilers.evmVersion,
    },
  },
  typechain: {
    outDir: 'types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false,
  },
  defaultNetwork: 'obsidians',
  networks: {
    hardhat: {},
    obsidians: {
      url: 'http://localhost:62743',
      accounts: 'remote',
      timeout: 0,
    },
  },
}
