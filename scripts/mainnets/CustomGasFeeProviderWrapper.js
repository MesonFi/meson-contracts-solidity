const { EthersProviderWrapper } = require("@nomiclabs/hardhat-ethers/internal/ethers-provider-wrapper");

module.exports = class CustomGasFeeProviderWrapper extends EthersProviderWrapper {
  async getFeeData() {
    const result = await super.getFeeData()
    // For Polygon
    // result.maxFeePerGas = result.gasPrice.add(50)
    // result.maxPriorityFeePerGas = result.gasPrice
    // console.log(result)
    return result
  }

  async getGasPrice() {
    const estimated = await super.getGasPrice()
    return estimated
  }
}
