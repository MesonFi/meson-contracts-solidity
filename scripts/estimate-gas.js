const { MesonClient, SignedSwapRequest } = require ('@mesonfi/sdk/src')
const { Meson, ERC20 }  = require ('@mesonfi/contract-abis')
const { ethers,BigNumber } = require('hardhat')
const { getDefaultSwap }  = require ( '../test/shared/meson')
const { provider3 }  = require ( '../test/shared/wallet')
async function main() {
let defaultProvider = ethers.getDefaultProvider("http://127.0.0.1:8545/");
// use hardhat default wallet (see test/shared/wallet.ts)
//#####################---deploy contract ---#############################
const MockToken = await ethers.getContractFactory('MockToken')
const MockTokenAddress = await MockToken.deploy("MesonToken","mtk", "10000000000000000000000000000000000")
console.log('MockToken deployed to:', MockTokenAddress.address)
await MockTokenAddress.deployed
const poolsFactory = await ethers.getContractFactory('MesonPoolsTest')
const MesonPoolsTest = await poolsFactory.deploy()
await MesonPoolsTest.deployed
console.log('poolsFactory deployed to:', MesonPoolsTest.address)
const swapFactory = await ethers.getContractFactory('MesonSwapTest')
const  MesonSwapTest = await swapFactory.deploy()
await MesonSwapTest.deployed
console.log('MesonSwapTest deployed to:', MesonSwapTest.address)
//#####################---add token into pools ---#############################
await MesonPoolsTest.addTokenToSwapList(MockTokenAddress.address)
await MesonSwapTest.addTokenToSwapList(MockTokenAddress.address)
let outChain = await MesonSwapTest.getCoinType()
let userClient = await MesonClient.Create(MesonSwapTest)
let lpClient = await MesonClient.Create(MesonSwapTest)
//##########################---requestSwap---###########################
const swap = userClient.requestSwap(outChain, getDefaultSwap({ inToken: MockTokenAddress.address,outToken: MockTokenAddress.address}))
const exported = await swap.exportRequest(provider3)
const signedRequest = new SignedSwapRequest(exported)
const approveTx = await MockTokenAddress.approve(MesonSwapTest.address, swap.amount)
getUsedGas('approveTx',approveTx.hash)
await approveTx.wait(1)
//##########################---postSwap---###########################
const postSwap =await lpClient.postSwap(signedRequest)
getUsedGas('postSwapHash',postSwap.hash)
//###########################---lock---###########################
await MockTokenAddress.approve(MesonPoolsTest.address, signedRequest.amount)
await MesonPoolsTest.deposit(signedRequest.outToken, signedRequest.amount)
const lock =await MesonPoolsTest.lock(signedRequest.swapId, signedRequest.initiator, signedRequest.amount, signedRequest.outToken)
getUsedGas('lockHash',lock.hash)
//###########################---用户释放签名---###########################
//###########################---Release---###########################
const swapData = getDefaultSwap({ outToken: MockTokenAddress.address })
const signedRelease = await swap.exportRelease(provider3, swapData.recipient)
SignedSwapRequest.CheckReleaseSignature(signedRelease)
const release=await MesonPoolsTest.release(signedRelease.swapId, signedRelease.recipient, swap.amount, signedRelease.domainHash, ...signedRelease.signature)
getUsedGas('releaseHash',release.hash)
function getUsedGas(name,hash){
    defaultProvider.getTransactionReceipt(hash).then((receipt) => {
        console.log(name+'Hash:'+receipt.transactionHash+'--------UsedGas:'+receipt.cumulativeGasUsed);
    });
} 
 
}
main()