/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { MesonPools, MesonPoolsInterface } from "../MesonPools";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
    ],
    name: "SwapLocked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
    ],
    name: "SwapReleased",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint40",
        name: "",
        type: "uint40",
      },
    ],
    name: "addressOfIndex",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
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
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "balanceOf",
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
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint48",
        name: "balanceIndex",
        type: "uint48",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint48",
        name: "balanceIndex",
        type: "uint48",
      },
    ],
    name: "depositAndRegister",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "initiator",
        type: "address",
      },
    ],
    name: "getLockedSwap",
    outputs: [
      {
        internalType: "address",
        name: "provider",
        type: "address",
      },
      {
        internalType: "uint40",
        name: "until",
        type: "uint40",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getShortCoinType",
    outputs: [
      {
        internalType: "bytes2",
        name: "",
        type: "bytes2",
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
    name: "indexOfAddress",
    outputs: [
      {
        internalType: "uint40",
        name: "",
        type: "uint40",
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
    name: "indexOfToken",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "initiator",
        type: "address",
      },
    ],
    name: "lock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "tokenIndex",
        type: "uint8",
      },
    ],
    name: "mesonFeeCollected",
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
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "initiator",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    name: "release",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "supportedTokens",
    outputs: [
      {
        internalType: "address[]",
        name: "tokens",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "tokenIndex",
        type: "uint8",
      },
    ],
    name: "tokenForIndex",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "initiator",
        type: "address",
      },
    ],
    name: "unlock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "tokenIndex",
        type: "uint8",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50611a1c806100206000396000f3fe608060405234801561001057600080fd5b50600436106100f55760003560e01c8063b3df5b3611610097578063eba7fb7711610066578063eba7fb77146102d6578063f1d2ec1d14610304578063f7888aec14610317578063ff3787191461032a57600080fd5b8063b3df5b361461021c578063be18e8a414610277578063ce9247431461028a578063e16a567d1461029d57600080fd5b806360a2da98116100d357806360a2da981461019c5780638f487dc9146101e1578063903d4296146101f4578063b002249d1461020757600080fd5b80631aba3a55146100fa5780632335093c1461013c57806337b90a4f14610187575b600080fd5b610121610108366004611655565b60026020526000908152604090205464ffffffffff1681565b60405164ffffffffff90911681526020015b60405180910390f35b61017561014a366004611655565b73ffffffffffffffffffffffffffffffffffffffff1660009081526001602052604090205460ff1690565b60405160ff9091168152602001610133565b61019a61019536600461179e565b610363565b005b6101af6101aa3660046116cc565b610420565b6040805173ffffffffffffffffffffffffffffffffffffffff909316835264ffffffffff909116602083015201610133565b61019a6101ef36600461179e565b61047b565b61019a6102023660046117d9565b610707565b61020f6107fe565b6040516101339190611879565b61025261022a3660046117fc565b60036020526000908152604090205473ffffffffffffffffffffffffffffffffffffffff1681565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610133565b61019a6102853660046116ef565b61094b565b61019a61029836600461173f565b610c07565b6102c86102ab366004611823565b60281b65ff00000000001660009081526004602052604090205490565b604051908152602001610133565b6040517f02ca0000000000000000000000000000000000000000000000000000000000008152602001610133565b61019a6103123660046116cc565b610d42565b6102c8610325366004611677565b610e8a565b610252610338366004611823565b60ff1660009081526020819052604090205473ffffffffffffffffffffffffffffffffffffffff1690565b600082116103b85760405162461bcd60e51b815260206004820152601760248201527f416d6f756e74206d75737420626520706f73697469766500000000000000000060448201526064015b60405180910390fd5b65ffffffffffff8116600090815260046020526040812080548492906103df9084906118d3565b909155505060ff602882901c1660009081526020819052604090205461041c9073ffffffffffffffffffffffffffffffffffffffff163384610f1a565b5050565b600080600061042f85856110ab565b60009081526005602090815260408083205464ffffffffff8082168552600390935292205473ffffffffffffffffffffffffffffffffffffffff169760289290921c1695509350505050565b600082116104cb5760405162461bcd60e51b815260206004820152601760248201527f416d6f756e74206d75737420626520706f73697469766500000000000000000060448201526064016103af565b338164ffffffffff81166105215760405162461bcd60e51b815260206004820152601e60248201527f43616e6e6f742075736520302061732070726f766964657220696e646578000060448201526064016103af565b64ffffffffff811660009081526003602052604090205473ffffffffffffffffffffffffffffffffffffffff161561059b5760405162461bcd60e51b815260206004820152601860248201527f496e64657820616c72656164792072656769737465726564000000000000000060448201526064016103af565b73ffffffffffffffffffffffffffffffffffffffff821660009081526002602052604090205464ffffffffff16156106155760405162461bcd60e51b815260206004820152601a60248201527f4164647265737320616c7265616479207265676973746572656400000000000060448201526064016103af565b64ffffffffff8116600081815260036020908152604080832080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff881690811790915583526002825280832080547fffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000001690941790935565ffffffffffff861682526004905290812080548692906106c49084906118d3565b909155505060ff602884901c166000908152602081905260409020546107019073ffffffffffffffffffffffffffffffffffffffff168386610f1a565b50505050565b3360008181526002602052604090205464ffffffffff16806107915760405162461bcd60e51b815260206004820152602e60248201527f43616c6c6572206e6f7420726567697374657265642e2043616c6c206465706f60448201527f736974416e64526567697374657200000000000000000000000000000000000060648201526084016103af565b64ffffffffff8116602884901b65ff00000000001617600090815260046020526040812080548692906107c5908490611928565b909155505060ff83166000908152602081905260409020546107019073ffffffffffffffffffffffffffffffffffffffff16838661110c565b606060015b6101008160ff1610156108b65760ff811660009081526020819052604090205473ffffffffffffffffffffffffffffffffffffffff166108a4578060ff166001141561084d575090565b61085860018261193f565b60ff1667ffffffffffffffff811115610873576108736119e0565b60405190808252806020026020018201604052801561089c578160200160208202803683370190505b5091506108b6565b806108ae81611962565b915050610803565b60015b8160ff168160ff1610156109465760ff811660009081526020819052604090205473ffffffffffffffffffffffffffffffffffffffff16836108fc60018461193f565b60ff168151811061090f5761090f6119b1565b73ffffffffffffffffffffffffffffffffffffffff909216602092830291909101909101528061093e81611962565b9150506108b9565b505090565b846102ca6109598260201c90565b61ffff16146109aa5760405162461bcd60e51b815260206004820152601760248201527f53776170206e6f7420666f72207468697320636861696e00000000000000000060448201526064016103af565b60006109b687846110ab565b60008181526005602052604090205490915069ffffffffffffffffffff1615610a215760405162461bcd60e51b815260206004820152601360248201527f5377617020616c7265616479206578697374730000000000000000000000000060448201526064016103af565b610a2e878787878761132f565b3360009081526002602052604090205464ffffffffff1680610ab85760405162461bcd60e51b815260206004820152602f60248201527f43616c6c6572206e6f7420726567697374657265642e2043616c6c206465706f60448201527f736974416e6452656769737465722e000000000000000000000000000000000060648201526084016103af565b6000610ac66104b0426118d3565b9050603089901c64ffffffffff168110610b485760405162461bcd60e51b815260206004820152602560248201527f43616e6e6f74206c6f636b20626563617573652065787069726554732069732060448201527f736f6f6e2e00000000000000000000000000000000000000000000000000000060648201526084016103af565b65ff000000000060108a901b1664ffffffffff8316176000818152600460205260408120805460d08d901c9290610b80908490611928565b909155505060008481526005602052604080822080547fffffffffffffffffffffffffffffffffffffffffffff000000000000000000001664ffffffffff8716602887901b69ffffffffff00000000001617179055518b917fbfb879c34323c5601fafe832c3a8a1e31e12c288695838726ddeada86034edb491a250505050505050505050565b6000610c1387846110ab565b60008181526005602052604090205490915069ffffffffffffffffffff1680610c7e5760405162461bcd60e51b815260206004820152601360248201527f5377617020646f6573206e6f742065786973740000000000000000000000000060448201526064016103af565b610c8c8884898989896114a1565b600082815260056020526040812080547fffffffffffffffffffffffffffffffffffffffffffff000000000000000000001690558080610ccc8b60181c90565b60ff16815260208101919091526040016000205473ffffffffffffffffffffffffffffffffffffffff169050610d0c8185610d078c60d01c90565b61110c565b60405189907ffa628b578e095243f0544bfad9255f49d79d03a5bbf6c85875d05a215e247ad290600090a2505050505050505050565b6000610d4e83836110ab565b60008181526005602052604090205490915069ffffffffffffffffffff1680610db95760405162461bcd60e51b815260206004820152601360248201527f5377617020646f6573206e6f742065786973740000000000000000000000000060448201526064016103af565b42602882901c64ffffffffff1610610e135760405162461bcd60e51b815260206004820152601260248201527f53776170207374696c6c20696e206c6f636b000000000000000000000000000060448201526064016103af565b65ff0000000000601085901b1664ffffffffff8216176000818152600460205260408120805460d088901c9290610e4b9084906118d3565b90915550505060009182525060056020526040902080547fffffffffffffffffffffffffffffffffffffffffffff000000000000000000001690555050565b73ffffffffffffffffffffffffffffffffffffffff80831660009081526001602090815260408083205493851683526002909152812054909160ff169064ffffffffff16801580610edc575060ff8216155b15610eec57600092505050610f14565b64ffffffffff1660289190911b65ff0000000000161760009081526004602052604090205490505b92915050565b60008111610f6a5760405162461bcd60e51b815260206004820181905260248201527f416d6f756e74206d7573742062652067726561746572207468616e207a65726f60448201526064016103af565b789f4f2726179a224501d762422c946590d910000000000000008110610fd25760405162461bcd60e51b815260206004820152600f60248201527f416d6f756e74206f766572666c6f77000000000000000000000000000000000060448201526064016103af565b73ffffffffffffffffffffffffffffffffffffffff83166323b872dd8330610fff8564e8d4a510006118eb565b6040517fffffffff0000000000000000000000000000000000000000000000000000000060e086901b16815273ffffffffffffffffffffffffffffffffffffffff93841660048201529290911660248301526044820152606401602060405180830381600087803b15801561107357600080fd5b505af1158015611087573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061070191906116aa565b600082826040516020016110ee92919091825260601b7fffffffffffffffffffffffffffffffffffffffff00000000000000000000000016602082015260340190565b60405160208183030381529060405280519060200120905092915050565b789f4f2726179a224501d762422c946590d9100000000000000081106111745760405162461bcd60e51b815260206004820152600f60248201527f416d6f756e74206f766572666c6f77000000000000000000000000000000000060448201526064016103af565b60008073ffffffffffffffffffffffffffffffffffffffff85167fa9059cbb00000000000000000000000000000000000000000000000000000000856111bf8664e8d4a510006118eb565b60405173ffffffffffffffffffffffffffffffffffffffff90921660248301526044820152606401604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529181526020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff00000000000000000000000000000000000000000000000000000000909416939093179092529051611270919061183e565b6000604051808303816000865af19150503d80600081146112ad576040519150601f19603f3d011682016040523d82523d6000602084013e6112b2565b606091505b50915091508180156112dc5750805115806112dc5750808060200190518101906112dc91906116aa565b6113285760405162461bcd60e51b815260206004820152600f60248201527f5472616e73666572206661696c6564000000000000000000000000000000000060448201526064016103af565b5050505050565b73ffffffffffffffffffffffffffffffffffffffff81166113925760405162461bcd60e51b815260206004820152601e60248201527f5369676e65722063616e6e6f7420626520656d7074792061646472657373000060448201526064016103af565b6000858152602080822081527f9862d877599564bcd97c37305a7b0fdbe621d9c2a125026f2ad601f754a75abc8083526040808420815194855292840180825283905260ff86169084015260608301879052608083018690529160019060a0016020604051602081039080840390855afa158015611414573d6000803e3d6000fd5b5050506020604051035173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16146114985760405162461bcd60e51b815260206004820152601160248201527f496e76616c6964207369676e617475726500000000000000000000000000000060448201526064016103af565b50505050505050565b73ffffffffffffffffffffffffffffffffffffffff81166115045760405162461bcd60e51b815260206004820152601e60248201527f5369676e65722063616e6e6f7420626520656d7074792061646472657373000060448201526064016103af565b601485905260008681526034812060209081527f743e50106a7f059b52151dd4ba27a5f6c87b925ddfbdcf1c332e800da4b3df928083526040808420815194855292840180825283905260ff86169084015260608301879052608083018690529160019060a0016020604051602081039080840390855afa15801561158d573d6000803e3d6000fd5b5050506020604051035173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16146116115760405162461bcd60e51b815260206004820152601160248201527f496e76616c6964207369676e617475726500000000000000000000000000000060448201526064016103af565b5050505050505050565b803573ffffffffffffffffffffffffffffffffffffffff8116811461163f57600080fd5b919050565b803560ff8116811461163f57600080fd5b60006020828403121561166757600080fd5b6116708261161b565b9392505050565b6000806040838503121561168a57600080fd5b6116938361161b565b91506116a16020840161161b565b90509250929050565b6000602082840312156116bc57600080fd5b8151801515811461167057600080fd5b600080604083850312156116df57600080fd5b823591506116a16020840161161b565b600080600080600060a0868803121561170757600080fd5b85359450602086013593506040860135925061172560608701611644565b91506117336080870161161b565b90509295509295909350565b60008060008060008060c0878903121561175857600080fd5b86359550602087013594506040870135935061177660608801611644565b92506117846080880161161b565b915061179260a0880161161b565b90509295509295509295565b600080604083850312156117b157600080fd5b82359150602083013565ffffffffffff811681146117ce57600080fd5b809150509250929050565b600080604083850312156117ec57600080fd5b823591506116a160208401611644565b60006020828403121561180e57600080fd5b813564ffffffffff8116811461167057600080fd5b60006020828403121561183557600080fd5b61167082611644565b6000825160005b8181101561185f5760208186018101518583015201611845565b8181111561186e576000828501525b509190910192915050565b6020808252825182820181905260009190848201906040850190845b818110156118c757835173ffffffffffffffffffffffffffffffffffffffff1683529284019291840191600101611895565b50909695505050505050565b600082198211156118e6576118e6611982565b500190565b6000817fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff048311821515161561192357611923611982565b500290565b60008282101561193a5761193a611982565b500390565b600060ff821660ff84168082101561195957611959611982565b90039392505050565b600060ff821660ff81141561197957611979611982565b60010192915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fdfea164736f6c6343000806000a";

type MesonPoolsConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MesonPoolsConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MesonPools__factory extends ContractFactory {
  constructor(...args: MesonPoolsConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<MesonPools> {
    return super.deploy(overrides || {}) as Promise<MesonPools>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): MesonPools {
    return super.attach(address) as MesonPools;
  }
  connect(signer: Signer): MesonPools__factory {
    return super.connect(signer) as MesonPools__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MesonPoolsInterface {
    return new utils.Interface(_abi) as MesonPoolsInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MesonPools {
    return new Contract(address, _abi, signerOrProvider) as MesonPools;
  }
}
