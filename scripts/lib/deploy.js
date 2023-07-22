const { ethers } = require('hardhat')
const { Wallet: ZkWallet } = require('zksync-web3')
const { Deployer } = require('@matterlabs/hardhat-zksync-deploy')

const { adaptors } = require('@mesonfi/sdk')
const { Meson } = require('@mesonfi/contract-abis')

exports.deployMeson = async function deployMeson(wallet, upgradable, premiumManager, tokens) {
  let mesonContract
  if (upgradable === 2) {
    console.log('Deploying Proxy2ToMeson & UpgradableMeson...')
    const impl = await deployContract('UpgradableMeson', wallet, [])
    const proxy = await deployContract('Proxy2ToMeson', wallet, [impl.address, premiumManager])
    mesonContract = adaptors.getContract(proxy.address, Meson.abi, wallet)
  } else if (upgradable) {
    console.log('Deploying ProxyToMeson & UpgradableMeson...')
    const proxy = await deployContract('ProxyToMeson', wallet, [premiumManager])
    mesonContract = adaptors.getContract(proxy.address, Meson.abi, wallet)
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

async function deployTronContract(name, wallet, args) {
  const factory = await ethers.getContractFactory(name)
  const abi = JSON.parse(factory.interface.format('json'))
  const constructor = abi.find(({ type }) => type === 'constructor')
  if (constructor) {
    constructor.stateMutability = constructor.payable ? 'payable' : 'nonpayable'
  }
  const deployed = await wallet.tronWeb.contract().new({
    abi,
    bytecode: factory.bytecode,
    feeLimit: 5000_000000,
    callValue: 0,
    parameters: args
  })
  const instance = adaptors.getContract(deployed.address, abi, wallet)
  console.log(`${name} deployed to:`, instance.address)
  return instance
}
