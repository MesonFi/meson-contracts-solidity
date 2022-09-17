/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface MesonPoolsTestInterface extends utils.Interface {
  functions: {
    "addAuthorizedAddr(address)": FunctionFragment;
    "deposit(uint256,uint48)": FunctionFragment;
    "depositAndRegister(uint256,uint48)": FunctionFragment;
    "getLockedSwap(uint256,address)": FunctionFragment;
    "getShortCoinType()": FunctionFragment;
    "indexOfToken(address)": FunctionFragment;
    "lock(uint256,bytes32,bytes32,uint8,address)": FunctionFragment;
    "ownerOfPool(uint40)": FunctionFragment;
    "poolOfAuthorizedAddr(address)": FunctionFragment;
    "poolTokenBalance(address,address)": FunctionFragment;
    "release(uint256,bytes32,bytes32,uint8,address,address)": FunctionFragment;
    "removeAuthorizedAddr(address)": FunctionFragment;
    "serviceFeeCollected(uint8)": FunctionFragment;
    "supportedTokens()": FunctionFragment;
    "tokenForIndex(uint8)": FunctionFragment;
    "unlock(uint256,address)": FunctionFragment;
    "withdraw(uint256,uint48)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "addAuthorizedAddr",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "deposit",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "depositAndRegister",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getLockedSwap",
    values: [BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "getShortCoinType",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "indexOfToken",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "lock",
    values: [BigNumberish, BytesLike, BytesLike, BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "ownerOfPool",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "poolOfAuthorizedAddr",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "poolTokenBalance",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "release",
    values: [BigNumberish, BytesLike, BytesLike, BigNumberish, string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "removeAuthorizedAddr",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "serviceFeeCollected",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "supportedTokens",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "tokenForIndex",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "unlock",
    values: [BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "addAuthorizedAddr",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "deposit", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "depositAndRegister",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getLockedSwap",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getShortCoinType",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "indexOfToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "lock", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "ownerOfPool",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "poolOfAuthorizedAddr",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "poolTokenBalance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "release", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "removeAuthorizedAddr",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "serviceFeeCollected",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportedTokens",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "tokenForIndex",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "unlock", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {
    "SwapLocked(uint256)": EventFragment;
    "SwapReleased(uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "SwapLocked"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "SwapReleased"): EventFragment;
}

export type SwapLockedEvent = TypedEvent<
  [BigNumber],
  { encodedSwap: BigNumber }
>;

export type SwapLockedEventFilter = TypedEventFilter<SwapLockedEvent>;

export type SwapReleasedEvent = TypedEvent<
  [BigNumber],
  { encodedSwap: BigNumber }
>;

export type SwapReleasedEventFilter = TypedEventFilter<SwapReleasedEvent>;

export interface MesonPoolsTest extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: MesonPoolsTestInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    addAuthorizedAddr(
      addr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    deposit(
      amount: BigNumberish,
      poolTokenIndex: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    depositAndRegister(
      amount: BigNumberish,
      poolTokenIndex: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getLockedSwap(
      encodedSwap: BigNumberish,
      initiator: string,
      overrides?: CallOverrides
    ): Promise<[string, number] & { poolOwner: string; until: number }>;

    getShortCoinType(overrides?: CallOverrides): Promise<[string]>;

    indexOfToken(token: string, overrides?: CallOverrides): Promise<[number]>;

    lock(
      encodedSwap: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      v: BigNumberish,
      initiator: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    ownerOfPool(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    poolOfAuthorizedAddr(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<[number]>;

    poolTokenBalance(
      token: string,
      addr: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    release(
      encodedSwap: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      v: BigNumberish,
      initiator: string,
      recipient: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    removeAuthorizedAddr(
      addr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    serviceFeeCollected(
      tokenIndex: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    supportedTokens(
      overrides?: CallOverrides
    ): Promise<[string[]] & { tokens: string[] }>;

    tokenForIndex(
      tokenIndex: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    unlock(
      encodedSwap: BigNumberish,
      initiator: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    withdraw(
      amount: BigNumberish,
      poolTokenIndex: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  addAuthorizedAddr(
    addr: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  deposit(
    amount: BigNumberish,
    poolTokenIndex: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  depositAndRegister(
    amount: BigNumberish,
    poolTokenIndex: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getLockedSwap(
    encodedSwap: BigNumberish,
    initiator: string,
    overrides?: CallOverrides
  ): Promise<[string, number] & { poolOwner: string; until: number }>;

  getShortCoinType(overrides?: CallOverrides): Promise<string>;

  indexOfToken(token: string, overrides?: CallOverrides): Promise<number>;

  lock(
    encodedSwap: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    v: BigNumberish,
    initiator: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  ownerOfPool(arg0: BigNumberish, overrides?: CallOverrides): Promise<string>;

  poolOfAuthorizedAddr(
    arg0: string,
    overrides?: CallOverrides
  ): Promise<number>;

  poolTokenBalance(
    token: string,
    addr: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  release(
    encodedSwap: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    v: BigNumberish,
    initiator: string,
    recipient: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  removeAuthorizedAddr(
    addr: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  serviceFeeCollected(
    tokenIndex: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  supportedTokens(overrides?: CallOverrides): Promise<string[]>;

  tokenForIndex(
    tokenIndex: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  unlock(
    encodedSwap: BigNumberish,
    initiator: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  withdraw(
    amount: BigNumberish,
    poolTokenIndex: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    addAuthorizedAddr(addr: string, overrides?: CallOverrides): Promise<void>;

    deposit(
      amount: BigNumberish,
      poolTokenIndex: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    depositAndRegister(
      amount: BigNumberish,
      poolTokenIndex: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    getLockedSwap(
      encodedSwap: BigNumberish,
      initiator: string,
      overrides?: CallOverrides
    ): Promise<[string, number] & { poolOwner: string; until: number }>;

    getShortCoinType(overrides?: CallOverrides): Promise<string>;

    indexOfToken(token: string, overrides?: CallOverrides): Promise<number>;

    lock(
      encodedSwap: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      v: BigNumberish,
      initiator: string,
      overrides?: CallOverrides
    ): Promise<void>;

    ownerOfPool(arg0: BigNumberish, overrides?: CallOverrides): Promise<string>;

    poolOfAuthorizedAddr(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<number>;

    poolTokenBalance(
      token: string,
      addr: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    release(
      encodedSwap: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      v: BigNumberish,
      initiator: string,
      recipient: string,
      overrides?: CallOverrides
    ): Promise<void>;

    removeAuthorizedAddr(
      addr: string,
      overrides?: CallOverrides
    ): Promise<void>;

    serviceFeeCollected(
      tokenIndex: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    supportedTokens(overrides?: CallOverrides): Promise<string[]>;

    tokenForIndex(
      tokenIndex: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    unlock(
      encodedSwap: BigNumberish,
      initiator: string,
      overrides?: CallOverrides
    ): Promise<void>;

    withdraw(
      amount: BigNumberish,
      poolTokenIndex: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "SwapLocked(uint256)"(
      encodedSwap?: BigNumberish | null
    ): SwapLockedEventFilter;
    SwapLocked(encodedSwap?: BigNumberish | null): SwapLockedEventFilter;

    "SwapReleased(uint256)"(
      encodedSwap?: BigNumberish | null
    ): SwapReleasedEventFilter;
    SwapReleased(encodedSwap?: BigNumberish | null): SwapReleasedEventFilter;
  };

  estimateGas: {
    addAuthorizedAddr(
      addr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    deposit(
      amount: BigNumberish,
      poolTokenIndex: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    depositAndRegister(
      amount: BigNumberish,
      poolTokenIndex: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getLockedSwap(
      encodedSwap: BigNumberish,
      initiator: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getShortCoinType(overrides?: CallOverrides): Promise<BigNumber>;

    indexOfToken(token: string, overrides?: CallOverrides): Promise<BigNumber>;

    lock(
      encodedSwap: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      v: BigNumberish,
      initiator: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    ownerOfPool(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    poolOfAuthorizedAddr(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    poolTokenBalance(
      token: string,
      addr: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    release(
      encodedSwap: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      v: BigNumberish,
      initiator: string,
      recipient: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    removeAuthorizedAddr(
      addr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    serviceFeeCollected(
      tokenIndex: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    supportedTokens(overrides?: CallOverrides): Promise<BigNumber>;

    tokenForIndex(
      tokenIndex: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    unlock(
      encodedSwap: BigNumberish,
      initiator: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    withdraw(
      amount: BigNumberish,
      poolTokenIndex: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    addAuthorizedAddr(
      addr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    deposit(
      amount: BigNumberish,
      poolTokenIndex: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    depositAndRegister(
      amount: BigNumberish,
      poolTokenIndex: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getLockedSwap(
      encodedSwap: BigNumberish,
      initiator: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getShortCoinType(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    indexOfToken(
      token: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    lock(
      encodedSwap: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      v: BigNumberish,
      initiator: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    ownerOfPool(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    poolOfAuthorizedAddr(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    poolTokenBalance(
      token: string,
      addr: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    release(
      encodedSwap: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      v: BigNumberish,
      initiator: string,
      recipient: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    removeAuthorizedAddr(
      addr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    serviceFeeCollected(
      tokenIndex: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    supportedTokens(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    tokenForIndex(
      tokenIndex: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    unlock(
      encodedSwap: BigNumberish,
      initiator: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    withdraw(
      amount: BigNumberish,
      poolTokenIndex: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
