import { ethers } from 'hardhat'
import { MockToken } from '../../typechain/MockToken'
import { MesonPoolsTest } from '../../typechain/MesonPoolsTest'
import { MesonSwapTest } from '../../typechain/MesonSwapTest'

export async function fixtures () {
  const tokenFactory = await ethers.getContractFactory('MockToken')
  const token1: MockToken = await tokenFactory.deploy('Mock Token 1', 'MT1', 1000000000)
  const token2: MockToken = await tokenFactory.deploy('Mock Token 2', 'MT2', 1000000000)

  const poolsFactory = await ethers.getContractFactory('MesonPoolsTest')
  const pools: MesonPoolsTest = await poolsFactory.deploy()
  await pools.addTokenToSwapList(token1.address)

  const swapFactory = await ethers.getContractFactory('MesonSwapTest')
  const swap: MesonSwapTest = await swapFactory.deploy()
  await swap.addTokenToSwapList(token1.address)

  return { pools, swap, token1, token2 }
}
