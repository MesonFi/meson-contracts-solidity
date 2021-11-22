import { ethers } from 'hardhat'
// import { Contract, Wallet } from 'ethers'

// import { expandTo18Decimals } from './utilities'

// import ERC20 from '../../build/ERC20.json'

import { MockToken } from '../../typechain/MockToken'
import { MesonPoolsTest } from '../../typechain/MesonPoolsTest'

// interface FactoryFixture {
//   factory: 
// }

// const overrides = {
//   gasLimit: 9999999
// }

// export async function factoryFixture(_: Web3Provider, [wallet]: Wallet[]): Promise<FactoryFixture> {
//   const factory = await deployContract(wallet, UniswapV2Factory, [wallet.address], overrides)
//   return { factory }
// }

// interface PairFixture extends FactoryFixture {
//   token0: Contract
//   token1: Contract
//   pair: Contract
// }

// export async function pairFixture(): Promise<PairFixture> {
export async function fixtures() {
  const tokenFactory = await ethers.getContractFactory('MockToken')
  const token1: MockToken = await tokenFactory.deploy(1000000000)
  const token2: MockToken = await tokenFactory.deploy(1000000000)

  const factory = await ethers.getContractFactory('MesonPoolsTest')
  const contract: MesonPoolsTest = await factory.deploy()
  await contract.addTokenToSwapList(token1.address)

  return { contract, token1, token2 }
}
