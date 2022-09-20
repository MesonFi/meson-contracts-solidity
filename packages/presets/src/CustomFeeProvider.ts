import { providers, BigNumber, utils } from 'ethers'

export const CustomFeeHttpProvider = extendProvider(providers.StaticJsonRpcProvider) as typeof providers.StaticJsonRpcProvider
export const CustomFeeWsProvider = extendProvider(providers.WebSocketProvider) as typeof providers.WebSocketProvider

type Class<T> = new (...args: any[]) => T
function extendProvider(Provider: Class<providers.JsonRpcProvider>) {
  class CustomFeeProvider extends Provider {
    override async estimateGas(transaction: utils.Deferrable<providers.TransactionRequest>): Promise<BigNumber> {
      const gasLimit = await super.estimateGas(transaction)
      // TODO: logger.debug('Transaction', `estimate gas success`, { estimateGas: gasLimit.toString() })
      // TODO: log errors
      return gasLimit.mul(1.2 * 100).div(100)
    }

    override async getFeeData(): Promise<providers.FeeData> {
      const { block, gasPrice } = await utils.resolveProperties({
        block: this.getBlock('latest'),
        gasPrice: this.getGasPrice().catch((error) => {
          // @TODO: Why is this now failing on Calaveras?
          //console.log(error);
          return null
        })
      })

      let maxFeePerGas = null
      let maxPriorityFeePerGas = null
      if (block && block.baseFeePerGas) {
        // We may want to compute this more accurately in the future,
        // using the formula "check if the base fee is correct".
        // See: https://eips.ethereum.org/EIPS/eip-1559
        maxPriorityFeePerGas = await this.getRecommendedPriorityPrice() // TODO: gasPriorityFeeRange.limitWithin
        maxFeePerGas = block.baseFeePerGas.mul(2).add(maxPriorityFeePerGas) // TODO: gasPriceRange.limitWithin
      }

      // TODO: gasPriceRange.limitWithin(result.gasPrice)
      // TODO: log and log errors
      return { maxFeePerGas, maxPriorityFeePerGas, gasPrice, lastBaseFeePerGas: null }
    }

    override async getGasPrice(): Promise<BigNumber> {
      return super.getGasPrice()
    }

    async getRecommendedPriorityPrice(): Promise<BigNumber> {
      let block = await this.getBlockWithTransactions('latest')
      let retries = 3
      do {
        const fees = block.transactions.map((tx) => tx.maxPriorityFeePerGas).filter(Boolean)
        const sorted = fees.sort((a, b) => (a.eq(b) ? 0 : a.lt(b) ? -1 : 1))
        if (sorted.length > 0) {
          const index = Math.min(Math.ceil(sorted.length * 0.8), sorted.length - 1)
          return sorted[index]
        }
        block = await this.getBlockWithTransactions(block.number - 5)
      } while (--retries)
      return BigNumber.from(2_500_000_000)
    }
  }
  return CustomFeeProvider as unknown
}
