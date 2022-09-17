const { ethers } = require('hardhat')
const { Wallet: ZkWallet } = require('zksync-web3')

exports.getWallet = function getWallet (network, privateKey) {
  if (network.id.startsWith('tron')) {
    return require('./tron').getWallet(network, privateKey)
  } else if (network.id.startsWith('zksync')) {
    return require('./zksync').getWallet(network, privateKey)
  } else {
    return require('./evm').getWallet(network, privateKey)
  }
}

exports.deployContract = async function deployContract(name, wallet, args = []) {
  if (wallet instanceof ZkWallet) {
    return await require('./zksync').deployContract(name, wallet, args)
  } else if (wallet instanceof ethers.Wallet) {
    return await require('./evm').deployContract(name, wallet, args)
  } else {
    return await require('./tron').deployContract(name, wallet, args)
  }
}

exports.getContract = function getContract(address, abi, wallet) {
  if (wallet instanceof ZkWallet) {
    return require('./zksync').getContract(address, abi, wallet)
  } else if (wallet instanceof ethers.Wallet) {
    return require('./evm').getContract(address, abi, wallet)
  } else {
    return require('./tron').getContract(address, abi, wallet)
  }
}
