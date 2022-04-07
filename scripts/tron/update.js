const TronWeb = require('tronweb')
const { Meson } = require('@mesonfi/contract-abis')

const UpgradableMeson = require('../../artifacts/contracts/UpgradableMeson.sol/UpgradableMeson.json')

const tronWeb = new TronWeb({
  fullHost: 'https://api.nileex.io',
  privateKey: process.env.PRIVATE_KEY
})

const meson = 'TYtGRRt9ZcAtYEEVG4B5vGuxAWsrQ2WTFo'

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
