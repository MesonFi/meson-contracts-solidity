const { MockToken, MesonSwapTest } = require ('@mesonfi/contract-types/types')
const { getDefaultSwap }  = require ( '../test/shared/meson')
const { MesonClient, SignedSwapRequest } = require ('@mesonfi/sdk/src')
const { MesonPoolsTest__factory, MesonSwapTest__factory,MockToken__factory}  = require ( '../packages/contract-types/types/index.ts')

const ethers = require('ethers');

async function main() {
 
let provider = ethers.getDefaultProvider('kovan');
let privateKey = '4719806c5b87c68e046b7b958d4416f66ff752ce60a36d28c0b9c5f29cbc9ab0';
let wallet = new ethers.Wallet(privateKey, provider);

// 地址来自上面部署的合约
let tokenAddress = "0xf71D7875682BdD0C47Af795C55DA2B41edd3Ee6B";
// 使用Provider 连接合约，将只有对合约的可读权限
let  tokencontract = new ethers.Contract(tokenAddress, MockToken__factory.abi, provider);
let tokencontractWithSigner = tokencontract.connect(wallet);
 
// 地址来自上面部署的合约
let swapAddress = "0xDa9C9CEdAdC7a6f775150382765ccCA3D4Fa3021";
// 使用Provider 连接合约，将只有对合约的可读权限
let  swapcontract = new ethers.Contract(swapAddress, MesonSwapTest__factory.abi, provider);
let swapcontractWithSigner = swapcontract.connect(wallet);


// 地址来自上面部署的合约
let poolAddress = "0x676D3Bd93ec1f7517D5D12B3DE2AdfF0ABD7B0E6";
// 使用Provider 连接合约，将只有对合约的可读权限
let  poolcontract = new ethers.Contract(poolAddress,MesonPoolsTest__factory.abi , provider);
let poolcontractWithSigner = poolcontract.connect(wallet);

let outChain = await swapcontractWithSigner.getCoinType()
let userClient = await MesonClient.Create(swapcontractWithSigner)
let lpClient = await MesonClient.Create(swapcontractWithSigner)

//##########################---requestSwap---###########################
const swap = userClient.requestSwap(outChain, getDefaultSwap({ inToken: tokenAddress.address }))
const exported = await swap.exportRequest(wallet)
const signedRequest = new SignedSwapRequest(exported)
await tokencontractWithSigner.approve(swapcontractWithSigner.address, swap.amount)

//##########################---postSwap---###########################
await lpClient.postSwap(signedRequest)


//###########################---lock---###########################


//###########################---釋放資金---###########################


//###########################---Release---###########################
}
main()