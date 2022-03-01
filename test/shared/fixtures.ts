import { ethers } from 'hardhat'
import { MockToken, MesonPoolsTest, MesonSwapTest } from '@mesonfi/contract-types'

export const TOKEN_BALANCE = ethers.utils.parseUnits('30000', 6)
export const TOKEN_TOTAL_SUPPLY = ethers.utils.parseUnits('100000', 6)

export async function fixtures (accounts: string[] | undefined) {
  const signer = (await ethers.getSigners())[0]

  const tokenFactory = await ethers.getContractFactory('MockToken')
  const token1 = await tokenFactory.deploy('Mock Token 1', 'MT1', TOKEN_TOTAL_SUPPLY) as MockToken
  const token2 = await tokenFactory.deploy('Mock Token 2', 'MT2', TOKEN_TOTAL_SUPPLY) as MockToken

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
  const pools = await poolsFactory.deploy(token1.address) as MesonPoolsTest

  const swapFactory = await ethers.getContractFactory('MesonSwapTest')
  const swap = await swapFactory.deploy(token1.address) as MesonSwapTest

  return { pools, swap, token1, token2 }
}
