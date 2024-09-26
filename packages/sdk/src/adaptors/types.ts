import { type BigNumber } from 'ethers'

export type WrappedTransaction = {
  blockHash: string
}

export interface IAdaptor {
  get client()
  set client(c: any)
  get nodeUrl(): string
  detectNetwork(): Promise<any>
  getBlockNumber(): Promise<number>
  getTransactionCount(addr: string): Promise<any>
  getBalance(addr: string): Promise<BigNumber>
  getCode(addr: string): Promise<string>
  getLogs(filter: any): Promise<any>
  getGasPrice?: () => Promise<BigNumber>
  // on(): any
  // removeAllListeners(): any
  send(method: string, params: any[]): Promise<any>
  waitForTransaction(hash: string, confirmations?: number, timeout?: number): Promise<WrappedTransaction>
}

export type AdaptorConstructor = new (...args: any) => IAdaptor
