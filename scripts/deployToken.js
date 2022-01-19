
const { ethers } = require('hardhat')
 
async function main() {
  const MockToken = await ethers.getContractFactory('MockToken')
  console.log('Deploying MockToken...')
  const deployed = await MockToken.deploy("MesonToken","mtk",1000000000)
  console.log('MockToken deployed to:', deployed.address)
  await deployed.deployed

  const poolsFactory = await ethers.getContractFactory('MesonPoolsTest')
  const MesonPoolsTest = await poolsFactory.deploy()
  await MesonPoolsTest.deployed
  console.log('poolsFactory deployed to:', MesonPoolsTest.address)

  const swapFactory = await ethers.getContractFactory('MesonSwapTest')
  const  MesonSwapTest = await swapFactory.deploy()
  await MesonSwapTest.deployed
  console.log('MesonSwapTest deployed to:', MesonSwapTest.address)

  await MesonPoolsTest.addTokenToSwapList(deploye.address)
  await MesonSwapTest.addTokenToSwapList(deployed.address)
}

main()
