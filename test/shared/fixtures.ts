import { ethers } from 'hardhat'

import { MockToken } from '../../typechain/MockToken'
import { MesonPoolsTest } from '../../typechain/MesonPoolsTest'

export async function fixtures() {
  const tokenFactory = await ethers.getContractFactory('MockToken')
  const token1: MockToken = await tokenFactory.deploy(1000000000)
  const token2: MockToken = await tokenFactory.deploy(1000000000)

  const factory = await ethers.getContractFactory('MesonPoolsTest')
  const contract: MesonPoolsTest = await factory.deploy()
  await contract.addTokenToSwapList(token1.address)

  return { contract, token1, token2 }
}
