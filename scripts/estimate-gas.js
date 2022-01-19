const { MesonClient, SignedSwapRequest } = require('@mesonfi/sdk/src')
const { getDefaultSwap } = require('../test/shared/meson')

const ethers = hre.ethers

async function main() {
  // use hardhat default wallet (see test/shared/wallet.ts)
  const signer = await hre.ethers.getSigner()

  //#####################---deploy contract ---#############################
  const MockToken = await ethers.getContractFactory('MockToken')
  const totalSupply = '1000000000000'
  const tokenContract = await MockToken.deploy('Mock Token', 'MT', totalSupply)
  console.log('MockToken deployed to:', tokenContract.address)

  const mesonFactory = await ethers.getContractFactory('Meson')
  const mesonContract = await mesonFactory.deploy([tokenContract.address])
  console.log('Meson deployed to:', mesonContract.address)

  const mesonClient = await MesonClient.Create(mesonContract)

  // approve
  const approveTx = await tokenContract.approve(mesonContract.address, totalSupply)
  getUsedGas('approve', approveTx.hash)
  await approveTx.wait(1)

  // deposits
  const swapAmount = '1000000000'
  const depositTx1 = await mesonContract.deposit(tokenContract.address, swapAmount)
  getUsedGas('first deposit', depositTx1.hash)
  await depositTx1.wait(1)

  const depositTx2 = await mesonContract.deposit(tokenContract.address, swapAmount)
  getUsedGas('another deposit', depositTx2.hash)
  await depositTx2.wait(1)

  // requestSwap (no gas)
  const swapData = getDefaultSwap({
    inToken: tokenContract.address,
    outToken: tokenContract.address
  })
  const outChain = await mesonContract.getCoinType()
  const swap = mesonClient.requestSwap(outChain, swapData)
  const exported = await swap.exportRequest(signer)
  const signedRequest = new SignedSwapRequest(exported)

  const swapData2 = getDefaultSwap({
    amount: '200',
    inToken: tokenContract.address,
    outToken: tokenContract.address
  })
  const swap2 = mesonClient.requestSwap(outChain, swapData2)
  const exported2 = await swap2.exportRequest(signer)
  const signedRequest2 = new SignedSwapRequest(exported2)

  // postSwap
  const postSwapTx1 = await mesonClient.postSwap(signedRequest)
  getUsedGas('first postSwap', postSwapTx1.hash)
  await postSwapTx1.wait(1)

  const postSwapTx2 = await mesonClient.postSwap(signedRequest2)
  getUsedGas('another postSwap', postSwapTx2.hash)
  await postSwapTx2.wait(1)

  // lock
  const lockTx = await mesonContract.lock(signedRequest.swapId, signedRequest.initiator, signedRequest.amount, signedRequest.outToken)
  getUsedGas('lock', lockTx.hash)
  await lockTx.wait(1)

  // release signature (no gas)
  const signedRelease = await swap.exportRelease(signer, swapData.recipient)

  // Release
  SignedSwapRequest.CheckReleaseSignature(signedRelease)
  const releaseTx = await mesonContract.release(signedRelease.swapId, signedRelease.recipient, swap.amount, signedRelease.domainHash, ...signedRelease.signature)
  getUsedGas('release', releaseTx.hash)
}


function getUsedGas(name, hash) {
  ethers.provider.getTransactionReceipt(hash).then((receipt) => {
    // console.log('  Hash:', receipt.transactionHash)
    console.log(name, ':', receipt.cumulativeGasUsed.toString())
  });
}

main()