import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-change-network'
import '@openzeppelin/hardhat-upgrades'
import '@matterlabs/hardhat-zksync-deploy'
import '@matterlabs/hardhat-zksync-solc'
import dotenv from 'dotenv'
import { HardhatPluginError } from 'hardhat/plugins';

import { task } from 'hardhat/config'
import mainnets from '@mesonfi/presets/src/mainnets.json'
import testnets from '@mesonfi/presets/src/testnets.json'
import config from './config.json'

dotenv.config()

const {
  INFURA_API_KEY = ''
} = process.env

const mainnetConnections = Object.fromEntries(
  mainnets
    .filter(item => item.url)
    .map(item => [item.id, {
      url: item.url?.replace('${INFURA_API_KEY}', INFURA_API_KEY),
      zksync: item.id.startsWith('zksync'),
      ethNetwork: item.id.startsWith('zksync') && 'eth',
      timeout: 0,
      gas: 'auto',
      gasMultiplier: 1.1,
    }])
)
const testnetConnections = Object.fromEntries(
  testnets
    .filter(item => item.url)
    .map(item => [item.id, {
      url: item.url?.replace('${INFURA_API_KEY}', INFURA_API_KEY),
      zksync: item.id.startsWith('zksync'),
      ethNetwork: item.id.startsWith('zksync') && 'ropsten',
      timeout: 0,
    }])
)

task('chain', 'Switch chain-specific config for Meson')
  .addParam('mainnet', 'Mainnet network id', '')
  .addParam('testnet', 'Testnet network id', 'local')
  .setAction(async taskArgs => {
    const networkId = taskArgs.mainnet || taskArgs.testnet
    const testnetMode = !taskArgs.mainnet
    const setChainConfig = require('./scripts/config/set-chain-config')
    await setChainConfig(networkId, testnetMode)
  })

task('estimate', 'Estimate gas usage for Meson')
  .addParam('upgradable', 'If using MesonUpgradable', 'false')
  .setAction(async taskArgs => {
    if (!['true', 'false'].includes(taskArgs.upgradable)) {
      throw new HardhatPluginError(`The '--upgradable' parameter can only be 'true' or 'false'`)
    }
    const estimateGas = require('./scripts/estimate-gas')
    await estimateGas(taskArgs.upgradable === 'true')
  })

async function _switchNetwork(taskArgs: any) {
  const networkId = taskArgs.mainnet || taskArgs.testnet
  if (networkId === 'local') {
    throw new HardhatPluginError(`Network id cannot be 'local'`)
  }
  const testnetMode = !taskArgs.mainnet
  const setChainConfig = require('./scripts/config/set-chain-config')
  const network = await setChainConfig(networkId, testnetMode)
  return { network, testnetMode }
}

task('deploy', 'Deploy Meson contract')
  .addParam('mainnet', 'Mainnet network id', '')
  .addParam('testnet', 'Testnet network id', '')
  .addParam('upgradable', 'If using MesonUpgradable', 'false')
  .setAction(async taskArgs => {
    if (!['true', 'false'].includes(taskArgs.upgradable)) {
      throw new HardhatPluginError(`The '--upgradable' parameter can only be 'true' or 'false'`)
    }

    const { network, testnetMode } = await _switchNetwork(taskArgs)
    const deploy = require('./scripts/deploy')
    await deploy(network, taskArgs.upgradable === 'true', testnetMode)
  })

task('upgrade', 'Upgrade Meson contract')
  .addParam('mainnet', 'Mainnet network id', '')
  .addParam('testnet', 'Testnet network id', '')
  .setAction(async (taskArgs, hre) => {
    const { network } = await _switchNetwork(taskArgs)
    const upgrade = require('./scripts/upgrade')
    await upgrade(network)
  })

task('pool', 'Perform pool operation')
  .addParam('mainnet', 'Mainnet network id', '')
  .addParam('testnet', 'Testnet network id', '')
  .setAction(async taskArgs => {
    const { network } = await _switchNetwork(taskArgs)
    const pool = require('./scripts/pool')
    await pool(network)
  })

task('uct', 'Run UCT script')
  .addParam('mainnet', 'Mainnet network id', '')
  .addParam('testnet', 'Testnet network id', '')
  .setAction(async (taskArgs, hre) => {
    const { network } = await _switchNetwork(taskArgs)
    const uct = require('./scripts/uct')
    await uct(network)
  })

task('deploy-forward', 'Deploy ForwardTokenContract')
  .addParam('mainnet', 'Mainnet network id', '')
  .addParam('testnet', 'Testnet network id', '')
  .setAction(async taskArgs => {
    const { network } = await _switchNetwork(taskArgs)
    const deployForward = require('./scripts/deploy-forward')
    await deployForward(network)
  })

export default {
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
  zksolc: {
    version: '1.3.1',
    compilerSource: 'binary',
    settings: {},
  },
  defaultNetwork: 'hardhat',
  networks: {
    obsidians: {
      url: 'http://localhost:62743',
      accounts: 'remote',
      timeout: 0,
    },
    ...mainnetConnections,
    ...testnetConnections,
  },
  typechain: {
    outDir: 'packages/contract-types/types',
  }
}
