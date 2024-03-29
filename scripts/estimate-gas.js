const { ethers } = require('hardhat')
const {
  MesonClient,
  EthersWalletSwapSigner,
  SignedSwapRequest,
  SignedSwapRelease,
} = require('@mesonfi/sdk/src')

const { deployContract, deployMeson } = require('./lib/deploy')
const { wallet: unconnectedWallet } = require('../test/shared/wallet')
const { getPartialSwap } = require('../test/shared/meson')

const testnetMode = true

module.exports = async function main(upgradable) {
  const wallet = unconnectedWallet.connect(ethers.provider)
  const swapSigner = new EthersWalletSwapSigner(wallet)

  const totalSupply = ethers.utils.parseUnits('10000', 6)
  const tokenContract = await deployContract('MockToken', wallet, ['Mock Token', 'MT', totalSupply, 6])

  const tokens = [{ addr: tokenContract.address, tokenIndex: 1 }]
  const mesonContract = await deployMeson(wallet, !!upgradable, await wallet.getAddress(), tokens)
  const mesonClient = await MesonClient.Create(mesonContract, swapSigner)

  // approve
  const approveTx = await tokenContract.approve(mesonContract.address, totalSupply)
  getUsedGas('approve', approveTx.hash)
  await approveTx.wait(1)

  // deposits
  const amount = ethers.utils.parseUnits('1000', 6)
  const depositTx1 = await mesonClient.depositAndRegister(mesonClient.tokenAddr(1), amount, '1')
  getUsedGas('first deposit', depositTx1.hash)
  await depositTx1.wait(1)

  const depositTx2 = await mesonClient.deposit(mesonClient.tokenAddr(1), amount)
  getUsedGas('another deposit', depositTx2.hash)
  await depositTx2.wait(1)

  // requestSwap (no gas)
  const swapData = getPartialSwap()
  const outChain = await mesonContract.getShortCoinType()
  const swap = mesonClient.requestSwap(swapData, outChain)
  const request = await swap.signForRequest(testnetMode)
  const signedRequest = new SignedSwapRequest(request)
  signedRequest.checkSignature(testnetMode)

  const swapData2 = getPartialSwap({ amount: ethers.utils.parseUnits('500', 6) })
  const swap2 = mesonClient.requestSwap(swapData2, outChain)
  const request2 = await swap2.signForRequest(testnetMode)
  const signedRequest2 = new SignedSwapRequest(request2)
  signedRequest2.checkSignature(testnetMode)

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
  const release = await swap.signForRelease(swapData.recipient, testnetMode)
  const signedRelease = new SignedSwapRelease(release)
  signedRelease.checkSignature(testnetMode)

  // release
  const releaseTx = await mesonClient.release(signedRelease)
  getUsedGas('release', releaseTx.hash)

  // executeSwap
  const executeTx = await mesonClient.executeSwap(signedRelease, true)
  getUsedGas('execute', executeTx.hash)
}

function getUsedGas(name, hash) {
  ethers.provider.getTransactionReceipt(hash).then((receipt) => {
    console.log(name, ':', receipt.cumulativeGasUsed.toString())
  })
}
