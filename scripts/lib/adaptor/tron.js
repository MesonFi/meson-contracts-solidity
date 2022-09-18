const { ethers } = require('hardhat')
const TronWeb = require('tronweb')

exports.getWallet = function getTronWeb(network, privateKey) {
  const tronWeb = new TronWeb({
    fullHost: network.url,
    privateKey
  })
  return { address: tronWeb.defaultAddress.base58, tronWeb }
}

exports.deployContract = async function deployContract(name, wallet, args) {
  const factory = await ethers.getContractFactory(name)
  const abi = JSON.parse(factory.interface.format('json'))
  const constructor = abi.find(({ type }) => type === 'constructor')
  if (constructor) {
    constructor.stateMutability = constructor.payable ? 'payable' : 'nonpayable'
  }
  const deployed = await wallet.tronWeb.contract().new({
    abi,
    bytecode: factory.bytecode,
    feeLimit: 5000_000000,
    callValue: 0,
    parameters: args
  })
  const instance = _wrapTronContract(deployed)
  console.log(`${name} deployed to:`, instance.address)
  return instance
}

exports.getContract = function getContract(address, abi, wallet) {
  return _wrapTronContract(wallet.tronWeb.contract(abi, address))
}

function _wrapTronContract(instance) {
  return new Proxy(instance, {
    get(target, prop) {
      if (prop === 'address') {
        return TronWeb.address.fromHex(target.address)
      } else if (prop === 'interface') {
        return new ethers.utils.Interface(target.abi)
      }
      const method = target.methodInstances[prop]
      if (method?.abi?.type === 'function') {
        if (['view', 'pure'].includes(method.abi.stateMutability)) {
          return (...args) => target[prop](...args).call()
        } else {
          return async (...args) => {
            const txID = await target[prop](...args).send()
            const tx = await instance.tronWeb.trx.getTransaction(txID)
            tx.wait = () => new Promise(resolve => {
              const h = setInterval(async () => {
                const info = await instance.tronWeb.trx.getUnconfirmedTransactionInfo(txID)
                if (Object.keys(info).length) {
                  clearInterval(h)
                  resolve(info)
                }
              }, 1000)
            })
            return tx
          }
        }
      }
      return target[prop]
    }
  })
}
