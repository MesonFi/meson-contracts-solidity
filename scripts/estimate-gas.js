const { MesonClient, SignedSwapRequest } = require ('@mesonfi/sdk')
const { Meson, ERC20 }  = require ('@mesonfi/contract-abis')

const ethers = require('ethers')

const { getDefaultSwap }  = require ( '../test/shared/meson')

async function main() {
let provider = ethers.getDefaultProvider('ropsten'); // use hardhat network
// use hardhat default wallet (see test/shared/wallet.ts)
let privateKey = '0x4719806c5b87c68e046b7b958d4416f66ff752ce60a36d28c0b9c5f29cbc9ab0';
let wallet = new ethers.Wallet(privateKey, provider);

// deploy contract using scripts
let tokenAddress = "0x69584d9C068cF71319DfA80CFE1CCF4515816AD9";
let  tokencontract = new ethers.Contract(tokenAddress, ERC20.abi, wallet);
let swapAddress = "0xDd72b32f49D1722E22538Dd083e2861823417718";
let  swapcontract = new ethers.Contract(swapAddress, Meson.abi, wallet);
// let poolAddress = "0xDd72b32f49D1722E22538Dd083e2861823417718";
// let  poolcontract = new ethers.Contract(poolAddress, Meson.abi, wallet);

let outChain = await swapcontract.getCoinType()
let userClient = await MesonClient.Create(swapcontract)
let lpClient = await MesonClient.Create(swapcontract)

//##########################---requestSwap---###########################
const swap = userClient.requestSwap(outChain, getDefaultSwap({ inToken: tokenAddress }))
console.log("#########swap#####", swap)
const exported = await swap.exportRequest(wallet)
const signedRequest = new SignedSwapRequest(exported)
console.log("#########exported#####", exported)
const approveTx = await tokencontract.approve(swapcontract.address, swap.amount)
await approveTx.wait(1)

//##########################---postSwap---###########################
await lpClient.postSwap(signedRequest)


//###########################---lock---###########################



//###########################---Release---###########################
}
main()