const { EthersProviderWrapper } = require("@nomiclabs/hardhat-ethers/internal/ethers-provider-wrapper");

module.exports = class CustomGasFeeProviderWrapper extends EthersProviderWrapper {
  async getFeeData() {
    const result = await super.getFeeData()
    // result.maxFeePerGas = result.gasPrice.add(50)
    // result.maxPriorityFeePerGas = result.gasPrice
    return result
  }
}
