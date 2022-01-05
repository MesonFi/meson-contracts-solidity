import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import '@openzeppelin/hardhat-upgrades'

import { task } from 'hardhat/config';
import config from './config.json'

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

export default {
  solidity: {
    version: config.compilers.solc,
    settings: {
      optimizer: {
        enabled: process.env.DEBUG ? false : true,
      },
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
    fantom: {
      url: 'https://rpc.testnet.fantom.network',
      accounts: ['36a460fc4a89eec5d08b585eace1498a5db63a5950831691e4287343a0c58ce2'],
      timeout: 0,
    },
    polygon: {
      url: 'https://rpc.testnet.fantom.network',
      accounts: ['36a460fc4a89eec5d08b585eace1498a5db63a5950831691e4287343a0c58ce2'],
      timeout: 0,
    },
    Avalanche: {
      url: 'https://rpc.testnet.fantom.network',
      accounts: ['36a460fc4a89eec5d08b585eace1498a5db63a5950831691e4287343a0c58ce2'],
      timeout: 0,
    },
    Xdai: {
      url: 'https://rpc.xdaichain.com',
      accounts: ['36a460fc4a89eec5d08b585eace1498a5db63a5950831691e4287343a0c58ce2'],
      timeout: 0,
    },
  },
  typechain: {
    outDir: 'packages/contract-types/types',
  }
}
