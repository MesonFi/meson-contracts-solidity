const TronWeb = require('tronweb')
const { ethers } = require('ethers')
const UpgradableMeson = require('../../artifacts/contracts/UpgradableMeson.sol/UpgradableMeson.json')
const ERC1967Proxy = require('@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json')

const testnetMode = process.env.TESTNET_MODE
const fullHost = testnetMode ? 'https://api.nileex.io' : 'https://api.trongrid.io'
let tokens
if (testnetMode) {
  tokens = [
    { addr: 'TWpuhvz3tivwoQcm16kzaChAZHv2QRGcm5', tokenIndex: 1 },
    { addr: 'TFa74kDVGad7Lhwe2cwqgUQQY6D65odv2t', tokenIndex: 2 }
  ]
} else {
  tokens = [
    { addr: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', tokenIndex: 2 }
  ]
}

const tronWeb = new TronWeb({
  fullHost,
  privateKey: process.env.PRIVATE_KEY
})

async function deploy_contract() {
  let meson
  try {
    meson = await tronWeb.contract().new({
      abi: UpgradableMeson.abi,
      bytecode: UpgradableMeson.bytecode,
      feeLimit: 1000000000,
      callValue: 0,
      parameters: []
    })
  } catch (e) {
    console.log(e)
  }
  const mesonAddress = tronWeb.address.fromHex(meson.address)
  console.log(mesonAddress)

  const hexTokens = tokens.map(t => tronWeb.address.toHex(t.addr).replace(/^(41)/, '0x'))
  const indexes = tokens.map(t => t.tokenIndex)
  const factory = new ethers.ContractFactory(UpgradableMeson.abi , UpgradableMeson.bytecode)
  const data = factory.interface.encodeFunctionData('initialize', [hexTokens, indexes])

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
