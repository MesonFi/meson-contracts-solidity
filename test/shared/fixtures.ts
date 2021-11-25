import { ethers } from 'hardhat'

import { MockToken } from '../../typechain/MockToken'
import { MesonPoolsTest } from '../../typechain/MesonPoolsTest'
import { MesonSwapTest } from '../../typechain/MesonSwapTest'

export async function fixtures() {
  // default mnemonic for hardhat network
  const mnemonic = 'test test test test test test test test test test test junk'
  const wallet = ethers.Wallet.fromMnemonic(mnemonic)

  const tokenFactory = await ethers.getContractFactory('MockToken')
  const token1: MockToken = await tokenFactory.deploy(1000000000)
  const token2: MockToken = await tokenFactory.deploy(1000000000)

  const poolsFactory = await ethers.getContractFactory('MesonPoolsTest')
  const pools: MesonPoolsTest = await poolsFactory.deploy()
  await pools.addTokenToSwapList(token1.address)

  const swapFactory = await ethers.getContractFactory('MesonSwapTest')
  const swap: MesonSwapTest = await swapFactory.deploy()
  await swap.addTokenToSwapList(token1.address)

  return { wallet, pools, swap, token1, token2 }
}
