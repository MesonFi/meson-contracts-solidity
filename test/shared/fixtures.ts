import { ethers } from 'hardhat'
import { MockToken } from '../../typechain/MockToken'
import { MesonPoolsTest } from '../../typechain/MesonPoolsTest'
import { MesonSwapTest } from '../../typechain/MesonSwapTest'

export const TOKEN_BALANCE = ethers.utils.parseUnits('1000', 6)
export const TOKEN_TOTAL_SUPPLY = ethers.utils.parseUnits('10000', 6)

export async function fixtures (accounts: string[] | undefined) {
  const signer = (await ethers.getSigners())[0]

  const tokenFactory = await ethers.getContractFactory('MockToken')
  const token1: MockToken = await tokenFactory.deploy('Mock Token 1', 'MT1', TOKEN_TOTAL_SUPPLY)
  const token2: MockToken = await tokenFactory.deploy('Mock Token 2', 'MT2', TOKEN_TOTAL_SUPPLY)

  if (accounts) {
    for (const account of accounts) {
      await signer.sendTransaction({
        to: account,
        value: ethers.utils.parseEther('10')
      })
      await token1.transfer(account, TOKEN_BALANCE)
      await token2.transfer(account, TOKEN_BALANCE)
    }
  }

  const poolsFactory = await ethers.getContractFactory('MesonPoolsTest')
  const pools: MesonPoolsTest = await poolsFactory.deploy(token1.address)

  const swapFactory = await ethers.getContractFactory('MesonSwapTest')
  const swap: MesonSwapTest = await swapFactory.deploy(token1.address)

  return { pools, swap, token1, token2 }
}
