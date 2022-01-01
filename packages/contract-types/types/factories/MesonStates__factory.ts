/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { MesonStates, MesonStatesInterface } from "../MesonStates";

const _abi = [
  {
    inputs: [],
    name: "getChainId",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentChain",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "supportedTokens",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "totalDemandFor",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "totalSupplyFor",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x610100604052605260808181529061023c60a039805160209182012060408051808201825260088152674d65736f6e20466960c01b90840152805180820182526001808252603160f81b918501919091528151938401929092527fe127d7b8d403871d7ed6b19024db4422e92aee79823ba78ad61e52ee2a5f9b98908301527fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6606083015260808201523060a082015260c001604051602081830303815290604052805190602001206000553480156100d757600080fd5b50610155806100e76000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c80633408e4701461005c57806361565d251461007057806368c4ac26146100a757806372cbf72e146100da578063a8f81b1a146100ef575b600080fd5b604051600181526020015b60405180910390f35b61009961007e366004610118565b6001600160a01b031660009081526004602052604090205490565b604051908152602001610067565b6100ca6100b5366004610118565b60016020526000908152604090205460ff1681565b6040519015158152602001610067565b604051632000000f60e21b8152602001610067565b6100996100fd366004610118565b6001600160a01b031660009081526005602052604090205490565b60006020828403121561012a57600080fd5b81356001600160a01b038116811461014157600080fd5b939250505056fea164736f6c6343000806000a454950373132446f6d61696e28737472696e67206e616d652c737472696e672076657273696f6e2c75696e7432353620636861696e49642c6164647265737320766572696679696e67436f6e747261637429";

type MesonStatesConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MesonStatesConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MesonStates__factory extends ContractFactory {
  constructor(...args: MesonStatesConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<MesonStates> {
    return super.deploy(overrides || {}) as Promise<MesonStates>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): MesonStates {
    return super.attach(address) as MesonStates;
  }
  connect(signer: Signer): MesonStates__factory {
    return super.connect(signer) as MesonStates__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MesonStatesInterface {
    return new utils.Interface(_abi) as MesonStatesInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MesonStates {
    return new Contract(address, _abi, signerOrProvider) as MesonStates;
  }
}
