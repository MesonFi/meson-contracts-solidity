const TronWeb = require('tronweb')
const { ethers } = require('ethers')
const UpgradableMeson = require('../../artifacts/contracts/UpgradableMeson.sol/UpgradableMeson.json')
const ERC1967Proxy = require('@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json')

const tronWeb = new TronWeb({
  fullHost: 'https://api.nileex.io',
  privateKey: process.env.PRIVATE_KEY
})

const usdt = 'TFa74kDVGad7Lhwe2cwqgUQQY6D65odv2t'
const usdc = 'TWpuhvz3tivwoQcm16kzaChAZHv2QRGcm5'

async function deploy_contract() {
  let meson
  try {
    meson = await tronWeb.contract().new({
      abi: UpgradableMeson.abi,
      bytecode: UpgradableMeson.bytecode,
      feeLimit: 1000000000,
      callValue: 0,
      parameters: [[usdt, usdc]]
    })
  } catch (e) {
    console.log(e)
  }
  const mesonAddress = tronWeb.address.fromHex(meson.address)
  console.log(mesonAddress)

  const hexUsdt = tronWeb.address.toHex(usdt).replace(/^(41)/, '0x')
  const hexUsdc = tronWeb.address.toHex(usdc).replace(/^(41)/, '0x')
  const factory = new ethers.ContractFactory(UpgradableMeson.abi , UpgradableMeson.bytecode)
  const data = factory.interface.encodeFunctionData('initialize', [[hexUsdt, hexUsdc]])

  let proxy
  try {
    proxy = await tronWeb.contract().new({
      abi: ERC1967Proxy.abi,
      bytecode: ERC1967Proxy.bytecode,
      feeLimit: 1000000000,
      callValue: 0,
      parameters: [mesonAddress, data]
    })
  } catch (e) {
    console.log(e)
  }
  const proxyAddress = tronWeb.address.fromHex(proxy.address)
  console.log(proxyAddress)
}

deploy_contract()
