const { ethers, upgrades } = require('hardhat')
const {
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} = require('@mesonfi/sdk/src')
const { wallet } = require('../test/shared/wallet')
const { getDefaultSwap } = require('../test/shared/meson')

async function main() {
  // const signer = await hre.ethers.getSigner()
  const swapSigner = new EthersWalletSwapSigner(wallet)

  //#####################---deploy contract ---#############################
  const MockToken = await ethers.getContractFactory('MockToken')
  const totalSupply = '1000000000000'
  const tokenContract = await MockToken.deploy('Mock Token', 'MT', totalSupply)
  console.log('MockToken deployed to:', tokenContract.address)

  const mesonFactory = await ethers.getContractFactory('UpgradableMeson')
  console.log('Deploying UpgradableMeson...')
  const mesonContract = await upgrades.deployProxy(mesonFactory, [[tokenContract.address]], { kind: 'uups' })
  await mesonContract.deployed()
  console.log('UpgradableMeson deployed to:', mesonContract.address)
  const mesonClient = await MesonClient.Create(mesonContract, swapSigner)

  // approve
  const approveTx = await tokenContract.approve(mesonContract.address, totalSupply)
  getUsedGas('approve', approveTx.hash)
  await approveTx.wait(1)

  // deposits
  const swapAmount = '1000000000'
  const depositTx1 = await mesonClient.depositAndRegister(mesonClient.token(1), swapAmount, '1')
  getUsedGas('first deposit', depositTx1.hash)
  await depositTx1.wait(1)

  const depositTx2 = await mesonClient.deposit(mesonClient.token(1), swapAmount)
  getUsedGas('another deposit', depositTx2.hash)
  await depositTx2.wait(1)

  // requestSwap (no gas)
  const swapData = getDefaultSwap({ inToken: 1, outToken: 1 })
  const outChain = await mesonContract.getShortCoinType()
  const swap = mesonClient.requestSwap(swapData, outChain)
  const exported = await swap.exportRequest()
  const signedRequest = new SignedSwapRequest(exported)
  signedRequest.checkSignature()

  const swapData2 = getDefaultSwap({ amount: '200', inToken: 1, outToken: 1 })
  const swap2 = mesonClient.requestSwap(swapData2, outChain)
  const exported2 = await swap2.exportRequest()
  const signedRequest2 = new SignedSwapRequest(exported2)
  signedRequest2.checkSignature()

  // postSwap
  const postSwapTx1 = await mesonClient.postSwap(signedRequest)
  getUsedGas('first postSwap', postSwapTx1.hash)
  await postSwapTx1.wait(1)

  const postSwapTx2 = await mesonClient.postSwap(signedRequest2)
  getUsedGas('another postSwap', postSwapTx2.hash)
  await postSwapTx2.wait(1)

  // lock
  const lockTx = await mesonClient.lock(signedRequest)
  getUsedGas('lock', lockTx.hash)
  await lockTx.wait(1)

  // export release signature
  const exportedRelease = await swap.exportRelease(swapData.recipient)
  const signedRelease = new SignedSwapRelease(exportedRelease)
  signedRelease.checkSignature()

  // release
  const releaseTx = await mesonClient.release(signedRelease)
  getUsedGas('release', releaseTx.hash)

  // executeSwap
  const executeTx = await mesonClient.executeSwap(signedRelease, true)
  getUsedGas('execute', executeTx.hash)
}


function getUsedGas(name, hash) {
  ethers.provider.getTransactionReceipt(hash).then((receipt) => {
    // console.log('  Hash:', receipt.transactionHash)
    console.log(name, ':', receipt.cumulativeGasUsed.toString())
  });
}

main()