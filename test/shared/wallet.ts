import { ethers } from 'hardhat'

// default mnemonic for hardhat network
const mnemonic = 'test test test test test test test test test test test junk'
export const wallet = ethers.Wallet.fromMnemonic(mnemonic)

const privateKey1 = '0xb0467aa26cc0b8f5de684b447287958fbeea2877adf194c284cf98d8d0fad2dd'
export const initiator = new ethers.Wallet(privateKey1, ethers.provider)

const privateKey2 = '0x3618b13685a4faf31003929844655e3c08c864128c45ce356f97de22612ede51'
export const provider = new ethers.Wallet(privateKey2, ethers.provider)

const privateKey3 ='0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
export const provider3 = new ethers.Wallet(privateKey3, ethers.provider)