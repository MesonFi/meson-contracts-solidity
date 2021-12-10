import { ethers } from 'hardhat'
import { MockToken } from '../../typechain/MockToken'
import { MesonPoolsTest } from '../../typechain/MesonPoolsTest'
import { MesonSwapTest } from '../../typechain/MesonSwapTest'

export async function fixtures (signer) {
  const defaultSigner = (await ethers.getSigners())[0]
  let deployer = defaultSigner

  if (signer) {
    await defaultSigner.sendTransaction({
      to: signer.address,
      value: ethers.utils.parseEther('10')
    })
    deployer = signer.connect(ethers.provider)
  }

  const tokenFactory = await ethers.getContractFactory('MockToken', deployer)
  const token1: MockToken = await tokenFactory.deploy('Mock Token 1', 'MT1', 1000000000)
  const token2: MockToken = await tokenFactory.deploy('Mock Token 2', 'MT2', 1000000000)

  const poolsFactory = await ethers.getContractFactory('MesonPoolsTest', deployer)
  const pools: MesonPoolsTest = await poolsFactory.deploy()
  await pools.addTokenToSwapList(token1.address)

  const swapFactory = await ethers.getContractFactory('MesonSwapTest', deployer)
  const swap: MesonSwapTest = await swapFactory.deploy()
  await swap.addTokenToSwapList(token1.address)

  return { pools, swap, token1, token2 }
}
