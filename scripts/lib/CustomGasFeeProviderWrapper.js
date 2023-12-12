const { ethers } = require('hardhat')
const { EthersProviderWrapper } = require('@nomiclabs/hardhat-ethers/internal/ethers-provider-wrapper')

module.exports = class CustomGasFeeProviderWrapper extends EthersProviderWrapper {
  async getFeeData() {
    const result = await super.getFeeData()
    // For BNB || Polygon || Linea
    // result.maxPriorityFeePerGas = result.gasPrice
    // result.maxFeePerGas = result.gasPrice.add(result.lastBaseFeePerGas)

    // For ftm
    // result.maxFeePerGas = null
    // result.maxPriorityFeePerGas = null // ethers.BigNumber.from(10_000_000_000)
    // result.gasPrice = ethers.BigNumber.from(300_000_000_000)
    // console.log(result)
    return result
  }

  async estimateGas(transaction) {
    const estimated = await super.estimateGas(transaction)
    // console.log(estimated)
    return estimated
  }
}
