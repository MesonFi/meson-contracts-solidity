import { type BigNumber } from 'ethers'

export type WrappedTransaction = {
  blockHash: string
  status?: number | string
}

export interface IAdaptor {
  get client()
  set client(c: any)
  get nodeUrl(): string
  detectNetwork(): Promise<any>
  getBlockNumber(): Promise<number>
  getGasPrice(): Promise<BigNumber>
  getBalance(addr: string): Promise<BigNumber>
  getCode(addr: string): Promise<string>
  // getTransactionCount(addr: string): Promise<any>
  getLogs(filter: any): Promise<any>
  // on(): any
  // removeAllListeners(): any
  send(method: string, params: any[]): Promise<any>
  waitForTransaction(hash: string, confirmations?: number, timeout?: number): Promise<WrappedTransaction>
}

export type AdaptorConstructor = new (...args: any) => IAdaptor
