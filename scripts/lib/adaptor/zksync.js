const { Wallet, Provider, Contract } = require('zksync-web3')
const { Deployer } = require('@matterlabs/hardhat-zksync-deploy')

exports.getWallet = function getZkWallet(network, privateKey) {
  const provider = new Provider(network.url)
  return new Wallet(privateKey, provider)
}

exports.deployContract = async function deployContract(name, wallet, args) {
  const deployer = new Deployer(hre, wallet)
  const artifact = await deployer.loadArtifact(name)

  const instance = await deployer.deploy(artifact, args)
  console.log(`${name} deployed to:`, instance.address)
  return instance
}

exports.getContract = function getContract(address, abi, wallet) {
  return new Contract(address, abi, wallet)
}
