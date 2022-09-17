const { ethers } = require('hardhat')

exports.getWallet = function getWallet (network, privateKey) {
  if (network.id.startsWith('tron')) {
    return require('./tron').getWallet(network, privateKey)
  } else {
    return require('./evm').getWallet(network, privateKey)
  }
}

exports.deployContract = async function deployContract(name, wallet, args = []) {
  if (wallet instanceof ethers.Wallet) {
    return await require('./evm').deployContract(name, wallet, args)
  } else {
    return await require('./tron').deployContract(name, wallet, args)
  }
}

exports.getContract = function getContract(address, abi, wallet) {
  if (wallet instanceof ethers.Wallet) {
    return require('./evm').getContract(address, abi, wallet)
  } else {
    return require('./tron').getContract(address, abi, wallet)
  }
}
