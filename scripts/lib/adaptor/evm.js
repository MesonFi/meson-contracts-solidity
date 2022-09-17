const { ethers } = require('hardhat')
const CustomGasFeeProviderWrapper = require('./CustomGasFeeProviderWrapper')

exports.getWallet = function getEthersWallet(network, privateKey) {
  hre.changeNetwork(network.id)
  ethers.provider = new CustomGasFeeProviderWrapper(ethers.provider)
  return new ethers.Wallet(privateKey, ethers.provider)
}

exports.deployContract = async function deployContract(name, wallet, args) {
  const factory = await ethers.getContractFactory(name, wallet)
  const instance = await factory.deploy(...args)
  await instance.deployed()
  console.log(`${name} deployed to:`, instance.address)
  return instance
}

exports.getContract = function getContract(address, abi, wallet) {
  return new ethers.Contract(address, abi, wallet)
}
