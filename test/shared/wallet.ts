import { ethers } from 'hardhat'

// default mnemonic for hardhat network
const mnemonic = 'test test test test test test test test test test test junk'
const wallet = ethers.Wallet.fromMnemonic(mnemonic)

export { wallet }