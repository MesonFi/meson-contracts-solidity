const TronWeb = require('tronweb')
const ProxyToMeson = require('../../artifacts/contracts/ProxyToMeson.sol/ProxyToMeson.json')

const {
  TESTNET_MODE,
  PREMIUM_MANAGER,
} = process.env

const fullHost = TESTNET_MODE ? 'https://api.nileex.io' : 'https://api.trongrid.io'
let tokens
if (TESTNET_MODE) {
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
      abi: ProxyToMeson.abi,
      bytecode: ProxyToMeson.bytecode,
      feeLimit: 1000000000,
      callValue: 0,
      parameters: [PREMIUM_MANAGER]
    })
  } catch (e) {
    console.log(e)
  }

  await meson.addMultipleSupportedTokens(tokens.map(t => t.addr), tokens.map(t => t.tokenIndex)).send()

  const mesonAddress = tronWeb.address.fromHex(meson.address)
  console.log(mesonAddress)
}

deploy_contract()
