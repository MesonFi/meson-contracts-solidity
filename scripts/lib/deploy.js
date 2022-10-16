const fs = require('fs')
const path = require('path')
const { ethers } = require('hardhat')
const { Wallet: ZkWallet } = require('zksync-web3')
const { Deployer } = require('@matterlabs/hardhat-zksync-deploy')

const { adaptor } = require('@mesonfi/sdk')
const { Meson } = require('@mesonfi/contract-abis')

exports.deployMeson = async function deployMeson(wallet, upgradable, premiumManager, tokens) {
  let mesonContract
  if (upgradable) {
    console.log('Deploying ProxyToMeson & UpgradableMeson...')
    const proxy = await deployContract('ProxyToMeson', wallet, [premiumManager])
    mesonContract = adaptor.getContract(proxy.address, Meson.abi, wallet)
  } else {
    console.log('Deploying Meson...')
    mesonContract = await deployContract('Meson', wallet, [premiumManager])
  }

  await new Promise(resolve => setTimeout(resolve, 2000))

  console.log('Adding supported tokens', tokens)
  const tx = await mesonContract.addMultipleSupportedTokens(tokens.map(t => t.addr), tokens.map(t => t.tokenIndex))
  await tx.wait(1)
  return mesonContract
}

async function deployContract(name, wallet, args = []) {
  if (wallet instanceof ZkWallet) {
    return await deployZkContract(name, wallet, args)
  } else if (wallet instanceof ethers.Wallet) {
    return await deployEtherContract(name, wallet, args)
  } else if (wallet.signer && wallet.client) {
    return await deployAptosContract(name, wallet, args)
  } else {
    return await deployTronContract(name, wallet, args)
  }
}
exports.deployContract = deployContract

async function deployZkContract(name, wallet, args) {
  const deployer = new Deployer(hre, wallet)
  const artifact = await deployer.loadArtifact(name)
  const instance = await deployer.deploy(artifact, args)
  console.log(`${name} deployed to:`, instance.address)
  return instance
}

async function deployEtherContract(name, wallet, args) {
  const factory = await ethers.getContractFactory(name, wallet)
  const instance = await factory.deploy(...args)
  await instance.deployed()
  console.log(`${name} deployed to:`, instance.address)
  return instance
}

async function deployAptosContract(name, wallet, args) {
  if (!name.startsWith('Meson')) {
    throw new Error('Not implemented')
  }

  const projectRoot = path.join(__dirname, '../../../meson-contracts-move')

  // TODO multiple modules?
  const module = fs.readFileSync(path.join(projectRoot, `build/Meson-Contracts-Move/bytecode_modules/${name}.mv`), 'hex')
  const metadata = fs.readFileSync(path.join(projectRoot, 'build/Meson-Contracts-Move/package-metadata.bcs'), 'hex')

  const deployed = await wallet.deploy(module, metadata)
  await deployed.wait()

  console.log(`${name} deployed`)
}
exports.deployAptosContract = deployAptosContract

async function deployTronContract(name, wallet, args) {
  const factory = await ethers.getContractFactory(name)
  const abi = JSON.parse(factory.interface.format('json'))
  const constructor = abi.find(({ type }) => type === 'constructor')
  if (constructor) {
    constructor.stateMutability = constructor.payable ? 'payable' : 'nonpayable'
  }
  const deployed = await wallet.contract().new({
    abi,
    bytecode: factory.bytecode,
    feeLimit: 5000_000000,
    callValue: 0,
    parameters: args
  })
  const instance = adaptor.getContract(deployed.address, abi, wallet)
  console.log(`${name} deployed to:`, instance.address)
  return instance
}
