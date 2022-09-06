import { ethers } from 'hardhat'
import { BigNumberish } from 'ethers'
import { PartialSwapData, SwapData } from '@mesonfi/sdk'

export const TestAddress = '0x7F342A0D04B951e8600dA1eAdD46afe614DaC20B'

export function getPartialSwap({
  amount = ethers.utils.parseUnits('1000', 6) as BigNumberish,
  fee = ethers.utils.parseUnits('1', 6) as BigNumberish,
  inToken = 1,
  outToken = 1,
} = {}): PartialSwapData {
  return {
    amount,
    fee,
    inToken,
    outToken,
    recipient: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
    salt: '0x80'
  }
}

export function getSwap({
  amount = ethers.utils.parseUnits('1000', 6) as BigNumberish,
  fee = ethers.utils.parseUnits('1', 6) as BigNumberish,
  expireTs = Math.floor(Date.now() / 1000) + 5400,
  inChain = '0x0001',
  inToken = 2,
  outChain = '0x0002',
  outToken = 3,
} = {}): SwapData {
  return {
    amount,
    fee,
    expireTs,
    inChain,
    inToken,
    outChain,
    outToken,
    recipient: '0x2ef8a51f8ff129dbb874a0efb021702f59c1b211',
  }
}
