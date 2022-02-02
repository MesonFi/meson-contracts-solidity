/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { MesonSwapTest, MesonSwapTestInterface } from "../MesonSwapTest";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
    ],
    name: "SwapBonded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
    ],
    name: "SwapCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
    ],
    name: "SwapPosted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
    ],
    name: "SwapRequested",
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
        name: "encodedSwap",
        type: "uint256",
      },
      {
        internalType: "uint40",
        name: "providerIndex",
        type: "uint40",
      },
    ],
    name: "bondSwap",
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
    ],
    name: "cancelSwap",
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
        internalType: "bytes32",
        name: "recipientHash",
        type: "bytes32",
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
        internalType: "bool",
        name: "depositToPool",
        type: "bool",
      },
    ],
    name: "executeSwap",
    outputs: [],
    stateMutability: "nonpayable",
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
        internalType: "uint208",
        name: "packedData",
        type: "uint208",
      },
    ],
    name: "postSwap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint40",
        name: "providerIndex",
        type: "uint40",
      },
    ],
    name: "register",
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
    ],
    name: "requestSwap",
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
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
    ],
    name: "swapInitiator",
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
    ],
    name: "swapProvider",
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
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405162001b6d38038062001b6d8339810160408190526200003491620000e7565b6200004181600162000048565b5062000119565b60ff81166200009d5760405162461bcd60e51b815260206004820152601b60248201527f43616e6e6f7420757365203020617320746f6b656e20696e6465780000000000604482015260640160405180910390fd5b6001600160a01b039091166000818152600160209081526040808320805460ff90961660ff19909616861790559382528190529190912080546001600160a01b0319169091179055565b600060208284031215620000fa57600080fd5b81516001600160a01b03811681146200011257600080fd5b9392505050565b611a4480620001296000396000f3fe608060405234801561001057600080fd5b50600436106100f45760003560e01c806360b9d97311610097578063eba7fb7711610066578063eba7fb77146102a3578063f7888aec146102d0578063ff378719146102f1578063ffa96ec41461032a57600080fd5b806360b9d973146102325780637c85018714610245578063b002249d14610258578063b3df5b361461026d57600080fd5b80632335093c116100d35780632335093c1461016357806335eff30f146101ae57806338b0b63f146101c157806354d6a2b71461021f57600080fd5b806207f5fd146100f95780631aba3a551461010e5780632217d48314610150575b600080fd5b61010c61010736600461185c565b61033d565b005b61013561011c3660046116f2565b60026020526000908152604090205464ffffffffff1681565b60405164ffffffffff90911681526020015b60405180910390f35b61010c61015e366004611764565b61051d565b61019c6101713660046116f2565b73ffffffffffffffffffffffffffffffffffffffff1660009081526001602052604090205460ff1690565b60405160ff9091168152602001610147565b61010c6101bc366004611839565b610771565b6101fa6101cf366004611764565b60009081526005602052604090205460281c73ffffffffffffffffffffffffffffffffffffffff1690565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610147565b61010c61022d366004611764565b6108d0565b6101fa610240366004611764565b610a4c565b61010c61025336600461177d565b610ad0565b610260610cb7565b60405161014791906118cd565b6101fa61027b36600461185c565b60036020526000908152604090205473ffffffffffffffffffffffffffffffffffffffff1681565b6040517e3c0000000000000000000000000000000000000000000000000000000000008152602001610147565b6102e36102de366004611714565b610e04565b604051908152602001610147565b6101fa6102ff366004611877565b60ff1660009081526020819052604090205473ffffffffffffffffffffffffffffffffffffffff1690565b61010c6103383660046117d9565b610e63565b3364ffffffffff82166103975760405162461bcd60e51b815260206004820152601260248201527f43616e6e6f742075736520696e6465782030000000000000000000000000000060448201526064015b60405180910390fd5b64ffffffffff821660009081526003602052604090205473ffffffffffffffffffffffffffffffffffffffff16156104115760405162461bcd60e51b815260206004820152601860248201527f496e64657820616c726561647920726567697374657265640000000000000000604482015260640161038e565b73ffffffffffffffffffffffffffffffffffffffff811660009081526002602052604090205464ffffffffff161561048b5760405162461bcd60e51b815260206004820152601a60248201527f4164647265737320616c72656164792072656769737465726564000000000000604482015260640161038e565b64ffffffffff9091166000818152600360209081526040808320805473ffffffffffffffffffffffffffffffffffffffff9096167fffffffffffffffffffffffff000000000000000000000000000000000000000090961686179055938252600290529190912080547fffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000169091179055565b80600881901c61ffff16603c146105765760405162461bcd60e51b815260206004820152601760248201527f53776170206e6f7420666f72207468697320636861696e000000000000000000604482015260640161038e565b60008281526005602052604090205478ffffffffffffffffffffffffffffffffffffffffffffffffff16156105ed5760405162461bcd60e51b815260206004820152601360248201527f5377617020616c72656164792065786973747300000000000000000000000000604482015260640161038e565b60006106044264ffffffffff603086901c1661193f565b9050610e1081116106575760405162461bcd60e51b815260206004820152601360248201527f45787069726520747320746f6f206561726c7900000000000000000000000000604482015260640161038e565b611c2081106106a85760405162461bcd60e51b815260206004820152601260248201527f45787069726520747320746f6f206c6174650000000000000000000000000000604482015260640161038e565b600033600085815260056020908152604080832080547fffffffffffffff000000000000000000000000000000000000000000000000001678ffffffffffffffffffffffffffffffffffffffff0000000000602887901b1617905560ff88168352908290529020549091506107389073ffffffffffffffffffffffffffffffffffffffff1682608087901c6110e0565b6040518481527fffb55ec353614a34485412bc8d469fe16d3c7f0a963be6dd266938f8ff7d6c3f9060200160405180910390a150505050565b60008281526005602052604090205478ffffffffffffffffffffffffffffffffffffffffffffffffff16806107e85760405162461bcd60e51b815260206004820152601360248201527f5377617020646f6573206e6f7420657869737400000000000000000000000000604482015260640161038e565b64ffffffffff81161561083d5760405162461bcd60e51b815260206004820152601f60248201527f5377617020626f6e64656420746f20616e6f746865722070726f766964657200604482015260640161038e565b60008381526005602090815260409182902080547fffffffffffffff000000000000000000000000000000000000000000000000001664ffffffffff861678ffffffffffffffffffffffffffffffffffffffffffffffffff86161717905590518481527f60a99b51ae498c44acbbe11031aed2a06a32be66d2122e6e2a7a16c087865cc9910160405180910390a1505050565b60008181526005602052604090205478ffffffffffffffffffffffffffffffffffffffffffffffffff166001811161094a5760405162461bcd60e51b815260206004820152601360248201527f5377617020646f6573206e6f7420657869737400000000000000000000000000604482015260640161038e565b42603083901c64ffffffffff16106109a45760405162461bcd60e51b815260206004820152601460248201527f53776170206973207374696c6c206c6f636b6564000000000000000000000000604482015260640161038e565b600082815260056020908152604080832080547fffffffffffffff0000000000000000000000000000000000000000000000000016905560ff8516835290829052902054610a159073ffffffffffffffffffffffffffffffffffffffff90811690602884901c16608085901c6111e4565b6040518281527ff6b6b4f7a13f02512c1b3aa8dcc4a07d7775a6a4becbd439efcbd37c5408e67f9060200160405180910390a15050565b60008181526005602052604081205478ffffffffffffffffffffffffffffffffffffffffffffffffff81169060281c73ffffffffffffffffffffffffffffffffffffffff16610a9e5750600092915050565b64ffffffffff1660009081526003602052604090205473ffffffffffffffffffffffffffffffffffffffff1692915050565b60008681526005602052604090205478ffffffffffffffffffffffffffffffffffffffffffffffffff1680610b475760405162461bcd60e51b815260206004820152601360248201527f5377617020646f6573206e6f7420657869737400000000000000000000000000604482015260640161038e565b610b53610e1042611927565b603088901c64ffffffffff161015610b9e57600087815260056020526040902080547fffffffffffffff00000000000000000000000000000000000000000000000000169055610bd6565b600087815260056020526040902080547fffffffffffffff000000000000000000000000000000000000000000000000001660011790555b610c03878787878760288778ffffffffffffffffffffffffffffffffffffffffffffffffff16901c61136a565b8115610c5f5764ffffffffff8116602888901b65ffffffffffff81168217600090815260046020526040902054911790610c419060808a901c6114d5565b65ffffffffffff909116600090815260046020526040902055610cae565b60ff87166000908152602081815260408083205464ffffffffff85168452600390925290912054610cae9173ffffffffffffffffffffffffffffffffffffffff908116911660808a901c6111e4565b50505050505050565b606060015b6101008160ff161015610d6f5760ff811660009081526020819052604090205473ffffffffffffffffffffffffffffffffffffffff16610d5d578060ff1660011415610d06575090565b610d11600182611956565b60ff1667ffffffffffffffff811115610d2c57610d2c6119f7565b604051908082528060200260200182016040528015610d55578160200160208202803683370190505b509150610d6f565b80610d6781611979565b915050610cbc565b60015b8160ff168160ff161015610dff5760ff811660009081526020819052604090205473ffffffffffffffffffffffffffffffffffffffff1683610db5600184611956565b60ff1681518110610dc857610dc86119c8565b73ffffffffffffffffffffffffffffffffffffffff9092166020928302919091019091015280610df781611979565b915050610d72565b505090565b73ffffffffffffffffffffffffffffffffffffffff8281166000908152600160209081526040808320549385168352600282528083205464ffffffffff1660289490941b65ff0000000000169390931782526004905220545b92915050565b83600881901c61ffff16603c14610ebc5760405162461bcd60e51b815260206004820152601760248201527f53776170206e6f7420666f72207468697320636861696e000000000000000000604482015260640161038e565b60008581526005602052604090205478ffffffffffffffffffffffffffffffffffffffffffffffffff1615610f335760405162461bcd60e51b815260206004820152601360248201527f5377617020616c72656164792065786973747300000000000000000000000000604482015260640161038e565b6000610f4a4264ffffffffff603089901c1661193f565b9050610e108111610f9d5760405162461bcd60e51b815260206004820152601360248201527f45787069726520747320746f6f206561726c7900000000000000000000000000604482015260640161038e565b611c208110610fee5760405162461bcd60e51b815260206004820152601260248201527f45787069726520747320746f6f206c6174650000000000000000000000000000604482015260640161038e565b74ffffffffffffffffffffffffffffffffffffffffff602884901c1661101e87878760ff60c889901c1685611533565b600087815260056020908152604080832080547fffffffffffffff000000000000000000000000000000000000000000000000001678ffffffffffffffffffffffffffffffffffffffffffffffffff891617905560ff8a168352908290529020546110a49073ffffffffffffffffffffffffffffffffffffffff168260808a901c6110e0565b6040518781527f5ce4019f772fda6cb703b26bce3ec3006eb36b73f1d3a0eb441213317d9f5e9d9060200160405180910390a150505050505050565b600081116111305760405162461bcd60e51b815260206004820181905260248201527f416d6f756e74206d7573742062652067726561746572207468616e207a65726f604482015260640161038e565b6040517f23b872dd00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8381166004830152306024830152604482018390528416906323b872dd90606401602060405180830381600087803b1580156111a657600080fd5b505af11580156111ba573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111de9190611747565b50505050565b604080518082018252601981527f7472616e7366657228616464726573732c75696e743235362900000000000000602091820152815173ffffffffffffffffffffffffffffffffffffffff85811660248301526044808301869052845180840390910181526064909201845291810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fa9059cbb00000000000000000000000000000000000000000000000000000000179052915160009283928716916112ab9190611892565b6000604051808303816000865af19150503d80600081146112e8576040519150601f19603f3d011682016040523d82523d6000602084013e6112ed565b606091505b50915091508180156113175750805115806113175750808060200190518101906113179190611747565b6113635760405162461bcd60e51b815260206004820152600f60248201527f5472616e73666572206661696c65640000000000000000000000000000000000604482015260640161038e565b5050505050565b73ffffffffffffffffffffffffffffffffffffffff81166113cd5760405162461bcd60e51b815260206004820152601e60248201527f5369676e65722063616e6e6f7420626520656d70747920616464726573730000604482015260640161038e565b60008681526020868152604080832082527f5ef297f2881340f11ed62c7c08e0e0c235c333ad8f340d7285f529f16716968a8352808320815193845291830180825282905260ff85169083015260608201869052608082018590529060019060a0016020604051602081039080840390855afa158015611451573d6000803e3d6000fd5b5050506020604051035173ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614610cae5760405162461bcd60e51b815260206004820152601160248201527f496e76616c6964207369676e6174757265000000000000000000000000000000604482015260640161038e565b6000826114e28382611927565b9150811015610e5d5760405162461bcd60e51b815260206004820152600860248201527f6f766572666c6f77000000000000000000000000000000000000000000000000604482015260640161038e565b73ffffffffffffffffffffffffffffffffffffffff81166115965760405162461bcd60e51b815260206004820152601e60248201527f5369676e65722063616e6e6f7420626520656d70747920616464726573730000604482015260640161038e565b6000858152602080822081527f9862d877599564bcd97c37305a7b0fdbe621d9c2a125026f2ad601f754a75abc82526040808320815193845291830180825282905260ff85169083015260608201869052608082018590529060019060a0016020604051602081039080840390855afa158015611617573d6000803e3d6000fd5b5050506020604051035173ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161461169b5760405162461bcd60e51b815260206004820152601160248201527f496e76616c6964207369676e6174757265000000000000000000000000000000604482015260640161038e565b505050505050565b803573ffffffffffffffffffffffffffffffffffffffff811681146116c757600080fd5b919050565b803564ffffffffff811681146116c757600080fd5b803560ff811681146116c757600080fd5b60006020828403121561170457600080fd5b61170d826116a3565b9392505050565b6000806040838503121561172757600080fd5b611730836116a3565b915061173e602084016116a3565b90509250929050565b60006020828403121561175957600080fd5b815161170d81611a26565b60006020828403121561177657600080fd5b5035919050565b60008060008060008060c0878903121561179657600080fd5b863595506020870135945060408701359350606087013592506117bb608088016116e1565b915060a08701356117cb81611a26565b809150509295509295509295565b600080600080608085870312156117ef57600080fd5b843593506020850135925060408501359150606085013579ffffffffffffffffffffffffffffffffffffffffffffffffffff8116811461182e57600080fd5b939692955090935050565b6000806040838503121561184c57600080fd5b8235915061173e602084016116cc565b60006020828403121561186e57600080fd5b61170d826116cc565b60006020828403121561188957600080fd5b61170d826116e1565b6000825160005b818110156118b35760208186018101518583015201611899565b818111156118c2576000828501525b509190910192915050565b6020808252825182820181905260009190848201906040850190845b8181101561191b57835173ffffffffffffffffffffffffffffffffffffffff16835292840192918401916001016118e9565b50909695505050505050565b6000821982111561193a5761193a611999565b500190565b60008282101561195157611951611999565b500390565b600060ff821660ff84168082101561197057611970611999565b90039392505050565b600060ff821660ff81141561199057611990611999565b60010192915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b8015158114611a3457600080fd5b5056fea164736f6c6343000806000a";

type MesonSwapTestConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MesonSwapTestConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MesonSwapTest__factory extends ContractFactory {
  constructor(...args: MesonSwapTestConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    token: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<MesonSwapTest> {
    return super.deploy(token, overrides || {}) as Promise<MesonSwapTest>;
  }
  getDeployTransaction(
    token: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(token, overrides || {});
  }
  attach(address: string): MesonSwapTest {
    return super.attach(address) as MesonSwapTest;
  }
  connect(signer: Signer): MesonSwapTest__factory {
    return super.connect(signer) as MesonSwapTest__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MesonSwapTestInterface {
    return new utils.Interface(_abi) as MesonSwapTestInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MesonSwapTest {
    return new Contract(address, _abi, signerOrProvider) as MesonSwapTest;
  }
}
