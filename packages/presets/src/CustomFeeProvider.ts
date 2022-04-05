import {
  type JsonRpcProvider,
  type TransactionRequest,
  type FeeData,
  StaticJsonRpcProvider,
  WebSocketProvider
} from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { type Deferrable, resolveProperties } from '@ethersproject/properties'

export const CustomFeeHttpProvider = extendProvider(StaticJsonRpcProvider) as typeof StaticJsonRpcProvider
export const CustomFeeWsProvider = extendProvider(WebSocketProvider) as typeof WebSocketProvider

type Class<T> = new (...args: any[]) => T
function extendProvider(Provider: Class<JsonRpcProvider>) {
  class CustomFeeProvider extends Provider {
    override async estimateGas(transaction: Deferrable<TransactionRequest>): Promise<BigNumber> {
      const gasLimit = await super.estimateGas(transaction)
      // TODO: logger.debug('Transaction', `estimate gas success`, { estimateGas: gasLimit.toString() })
      // TODO: log errors
      return gasLimit.mul(1.2 * 100).div(100)
    }

    override async getFeeData(): Promise<FeeData> {
      const { block, gasPrice } = await resolveProperties({
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
      return { maxFeePerGas, maxPriorityFeePerGas, gasPrice }
    }

    override async getGasPrice(): Promise<BigNumber> {
      return super.getGasPrice()
    }

    async getRecommendedPriorityPrice(): Promise<BigNumber> {
      let block = await this.getBlockWithTransactions('latest')
      let retries = 3
      do {
        const priorityFees = block.transactions
          .map((tx) => tx.maxPriorityFeePerGas)
          .filter((fee): fee is BigNumber => Boolean(fee))
          .sort((a, b) => (a.eq(b) ? 0 : a.lt(b) ? -1 : 1))
        if (priorityFees.length > 0) {
          const index = Math.min(Math.ceil(priorityFees.length * 0.8), priorityFees.length - 1)
          return priorityFees[index]
        }
        block = await this.getBlockWithTransactions(block.number - 5)
      } while (--retries)
      return BigNumber.from(2_500_000_000)
    }
  }
  return CustomFeeProvider as unknown
}
