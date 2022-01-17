import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-change-network'
import '@openzeppelin/hardhat-upgrades'
import dotenv from 'dotenv'

import { task } from 'hardhat/config'
import testnets from '@mesonfi/presets/src/testnets.json'
import config from './config.json'

dotenv.config()

const INFURA_API_KEY = process.env.INFURA_API_KEY as string

const networks = Object.fromEntries(
  testnets
    .filter(item => item.url)
    .map(item => [item.id, { url: item.url?.replace('${INFURA_API_KEY}', INFURA_API_KEY) }])
)

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
    ...networks,
  },
  typechain: {
    outDir: 'packages/contract-types/types',
  }
}
