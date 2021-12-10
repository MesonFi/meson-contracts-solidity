import { ethers } from 'hardhat'

// default mnemonic for hardhat network
const mnemonic = 'test test test test test test test test test test test junk'
export const wallet = ethers.Wallet.fromMnemonic(mnemonic)

// const privateKey = 'PRIVATE_KEY'
// export const wallet = new ethers.Wallet(privateKey)