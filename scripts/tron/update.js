const TronWeb = require('tronweb')

const UpgradableMeson = require('../../artifacts/contracts/UpgradableMeson.sol/UpgradableMeson.json')

const testnetMode = process.env.TESTNET_MODE
const fullHost = testnetMode ? 'https://api.nileex.io' : 'https://api.trongrid.io'
const meson = testnetMode ? 'TYtGRRt9ZcAtYEEVG4B5vGuxAWsrQ2WTFo' : 'TSpVXBLbkx5bxox4bRg1Up2e58mzCezQgf'

const tronWeb = new TronWeb({
  fullHost,
  privateKey: process.env.PRIVATE_KEY
})

async function deploy_contract() {
  let newImpl
  try {
    newImpl = await tronWeb.contract().new({
      abi: UpgradableMeson.abi,
      bytecode: UpgradableMeson.bytecode,
      feeLimit: 1000000000,
      callValue: 0,
      parameters: []
    })
  } catch (e) {
    console.log(e)
  }
  const implAddress = tronWeb.address.fromHex(newImpl.address)
  console.log(implAddress)

  const mesonContract = tronWeb.contract(UpgradableMeson.abi, meson)
  await mesonContract.upgradeTo(implAddress).send()
}

deploy_contract()
