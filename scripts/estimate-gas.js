const { MesonClient, SignedSwapRequest } = require('@mesonfi/sdk/src')
const { Meson, ERC20 } = require('@mesonfi/contract-abis')
const { getDefaultSwap } = require('../test/shared/meson')

const ethers = hre.ethers

async function main() {
  // use hardhat default wallet (see test/shared/wallet.ts)
  const signer = await hre.ethers.getSigner()

  //#####################---deploy contract ---#############################
  const MockToken = await ethers.getContractFactory('MockToken')
  const MockTokenAddress = await MockToken.deploy("Mock Token", "MT", "10000000000000000000000000000000000")
  console.log('MockToken deployed to:', MockTokenAddress.address)
  await MockTokenAddress.deployed
  const poolsFactory = await ethers.getContractFactory('MesonPoolsTest')
  const MesonPoolsTest = await poolsFactory.deploy()
  await MesonPoolsTest.deployed
  console.log('poolsFactory deployed to:', MesonPoolsTest.address)
  const swapFactory = await ethers.getContractFactory('MesonSwapTest')
  const MesonSwapTest = await swapFactory.deploy()
  await MesonSwapTest.deployed
  console.log('MesonSwapTest deployed to:', MesonSwapTest.address)

  //#####################---add token into pools ---#############################
  await MesonPoolsTest.addTokenToSwapList(MockTokenAddress.address)
  await MesonSwapTest.addTokenToSwapList(MockTokenAddress.address)
  const outChain = await MesonSwapTest.getCoinType()
  const userClient = await MesonClient.Create(MesonSwapTest)
  const lpClient = await MesonClient.Create(MesonSwapTest)

  const swapData = getDefaultSwap({
    inToken: MockTokenAddress.address,
    outToken: MockTokenAddress.address
  })

  //##########################---requestSwap---###########################
  const swap = userClient.requestSwap(outChain, swapData)
  const exported = await swap.exportRequest(signer)
  const signedRequest = new SignedSwapRequest(exported)
  const approveTx = await MockTokenAddress.approve(MesonSwapTest.address, swap.amount)
  getUsedGas('approve', approveTx.hash)
  await approveTx.wait(1)

  //##########################---postSwap---###########################
  const postSwap = await lpClient.postSwap(signedRequest)
  getUsedGas('postSwap', postSwap.hash)

  //###########################---lock---###########################
  await MockTokenAddress.approve(MesonPoolsTest.address, signedRequest.amount)
  await MesonPoolsTest.deposit(signedRequest.outToken, signedRequest.amount)
  const lock = await MesonPoolsTest.lock(signedRequest.swapId, signedRequest.initiator, signedRequest.amount, signedRequest.outToken)
  getUsedGas('lock', lock.hash)

  //###########################---publish release sig---###########################
  const signedRelease = await swap.exportRelease(signer, swapData.recipient)

  //###########################---Release---###########################
  SignedSwapRequest.CheckReleaseSignature(signedRelease)
  const release = await MesonPoolsTest.release(signedRelease.swapId, signedRelease.recipient, swap.amount, signedRelease.domainHash, ...signedRelease.signature)
  getUsedGas('release', release.hash)
}


function getUsedGas(name, hash) {
  ethers.provider.getTransactionReceipt(hash).then((receipt) => {
    console.log(name)
    console.log('  Hash:', receipt.transactionHash)
    console.log('  Gas used:', receipt.cumulativeGasUsed.toString())
  });
}

main()