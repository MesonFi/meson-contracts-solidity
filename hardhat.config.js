require('@typechain/hardhat')
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-ethers')
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
      metadata: {
        // do not include the metadata hash, since this is machine dependent
        // and we want all generated code to be deterministic
        // https://docs.soliditylang.org/en/v0.7.6/metadata.html
        bytecodeHash: 'none',
      },
    },
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
  typechain: {
    outDir: 'typechain',
  }
}
