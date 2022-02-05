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
        indexed: true,
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
        indexed: true,
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
        indexed: true,
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
    ],
    name: "SwapPosted",
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
    inputs: [
      {
        internalType: "uint256",
        name: "encodedSwap",
        type: "uint256",
      },
    ],
    name: "getPostedSwap",
    outputs: [
      {
        internalType: "address",
        name: "initiator",
        type: "address",
      },
      {
        internalType: "address",
        name: "provider",
        type: "address",
      },
      {
        internalType: "bool",
        name: "executed",
        type: "bool",
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
        internalType: "uint200",
        name: "postingValue",
        type: "uint200",
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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50604051620018af380380620018af833981016040819052610031916100e0565b61003c816001610042565b50610110565b60ff81166100965760405162461bcd60e51b815260206004820152601b60248201527f43616e6e6f7420757365203020617320746f6b656e20696e6465780000000000604482015260640160405180910390fd5b6001600160a01b039091166000818152600160209081526040808320805460ff90961660ff19909616861790559382528190529190912080546001600160a01b0319169091179055565b6000602082840312156100f257600080fd5b81516001600160a01b038116811461010957600080fd5b9392505050565b61178f80620001206000396000f3fe608060405234801561001057600080fd5b50600436106100de5760003560e01c80637c8501871161008c578063b3df5b3611610066578063b3df5b361461022e578063eba7fb7714610289578063f7888aec146102b6578063ff378719146102d757600080fd5b80637c850187146101f35780638302ce5a14610206578063b002249d1461021957600080fd5b80632335093c116100bd5780632335093c1461018257806335eff30f146101cd57806354d6a2b7146101e057600080fd5b806207f5fd146100e35780631aba3a55146100f85780631e2a60751461013a575b600080fd5b6100f66100f13660046115a7565b610310565b005b61011f61010636600461142b565b60026020526000908152604090205464ffffffffff1681565b60405164ffffffffff90911681526020015b60405180910390f35b61014d61014836600461149d565b6104f0565b6040805173ffffffffffffffffffffffffffffffffffffffff9485168152939092166020840152151590820152606001610131565b6101bb61019036600461142b565b73ffffffffffffffffffffffffffffffffffffffff1660009081526001602052604090205460ff1690565b60405160ff9091168152602001610131565b6100f66101db366004611584565b610582565b6100f66101ee36600461149d565b6106d4565b6100f66102013660046114b6565b610848565b6100f6610214366004611512565b610a2f565b610221610c9d565b6040516101319190611618565b61026461023c3660046115a7565b60036020526000908152604090205473ffffffffffffffffffffffffffffffffffffffff1681565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610131565b6040517e3c0000000000000000000000000000000000000000000000000000000000008152602001610131565b6102c96102c436600461144d565b610dea565b604051908152602001610131565b6102646102e53660046115c2565b60ff1660009081526020819052604090205473ffffffffffffffffffffffffffffffffffffffff1690565b3364ffffffffff821661036a5760405162461bcd60e51b815260206004820152601260248201527f43616e6e6f742075736520696e6465782030000000000000000000000000000060448201526064015b60405180910390fd5b64ffffffffff821660009081526003602052604090205473ffffffffffffffffffffffffffffffffffffffff16156103e45760405162461bcd60e51b815260206004820152601860248201527f496e64657820616c7265616479207265676973746572656400000000000000006044820152606401610361565b73ffffffffffffffffffffffffffffffffffffffff811660009081526002602052604090205464ffffffffff161561045e5760405162461bcd60e51b815260206004820152601a60248201527f4164647265737320616c726561647920726567697374657265640000000000006044820152606401610361565b64ffffffffff9091166000818152600360209081526040808320805473ffffffffffffffffffffffffffffffffffffffff9096167fffffffffffffffffffffffff000000000000000000000000000000000000000090961686179055938252600290529190912080547fffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000169091179055565b60008181526005602052604081205473ffffffffffffffffffffffffffffffffffffffff602882901c16919078ffffffffffffffffffffffffffffffffffffffffffffffffff1660018114908361054a576000925061057a565b64ffffffffff811660009081526003602052604090205473ffffffffffffffffffffffffffffffffffffffff1692505b509193909250565b60008281526005602052604090205478ffffffffffffffffffffffffffffffffffffffffffffffffff16806105f95760405162461bcd60e51b815260206004820152601360248201527f5377617020646f6573206e6f74206578697374000000000000000000000000006044820152606401610361565b64ffffffffff81161561064e5760405162461bcd60e51b815260206004820152601f60248201527f5377617020626f6e64656420746f20616e6f746865722070726f7669646572006044820152606401610361565b60008381526005602052604080822080547fffffffffffffff000000000000000000000000000000000000000000000000001664ffffffffff861678ffffffffffffffffffffffffffffffffffffffffffffffffff8616171790555184917f60a99b51ae498c44acbbe11031aed2a06a32be66d2122e6e2a7a16c087865cc991a2505050565b60008181526005602052604090205478ffffffffffffffffffffffffffffffffffffffffffffffffff166001811161074e5760405162461bcd60e51b815260206004820152601360248201527f5377617020646f6573206e6f74206578697374000000000000000000000000006044820152606401610361565b42603083901c64ffffffffff16106107a85760405162461bcd60e51b815260206004820152601460248201527f53776170206973207374696c6c206c6f636b65640000000000000000000000006044820152606401610361565b600082815260056020908152604080832080547fffffffffffffff0000000000000000000000000000000000000000000000000016905560ff85168352908290529020546108199073ffffffffffffffffffffffffffffffffffffffff90811690602884901c1660a085901c610e49565b60405182907ff6b6b4f7a13f02512c1b3aa8dcc4a07d7775a6a4becbd439efcbd37c5408e67f90600090a25050565b60008681526005602052604090205478ffffffffffffffffffffffffffffffffffffffffffffffffff16806108bf5760405162461bcd60e51b815260206004820152601360248201527f5377617020646f6573206e6f74206578697374000000000000000000000000006044820152606401610361565b6108cb610e1042611672565b603088901c64ffffffffff16101561091657600087815260056020526040902080547fffffffffffffff0000000000000000000000000000000000000000000000000016905561094e565b600087815260056020526040902080547fffffffffffffff000000000000000000000000000000000000000000000000001660011790555b61097b878787878760288778ffffffffffffffffffffffffffffffffffffffffffffffffff16901c610f9f565b81156109d75764ffffffffff8116602888901b65ffffffffffff811682176000908152600460205260409020549117906109b99060a08a901c61110a565b65ffffffffffff909116600090815260046020526040902055610a26565b60ff87166000908152602081815260408083205464ffffffffff85168452600390925290912054610a269173ffffffffffffffffffffffffffffffffffffffff908116911660a08a901c610e49565b50505050505050565b84600881901c61ffff16603c14610a885760405162461bcd60e51b815260206004820152601760248201527f53776170206e6f7420666f72207468697320636861696e0000000000000000006044820152606401610361565b60008681526005602052604090205478ffffffffffffffffffffffffffffffffffffffffffffffffff1615610aff5760405162461bcd60e51b815260206004820152601360248201527f5377617020616c726561647920657869737473000000000000000000000000006044820152606401610361565b6000610b164264ffffffffff60308a901c1661168a565b9050610e108111610b695760405162461bcd60e51b815260206004820152601360248201527f45787069726520747320746f6f206561726c79000000000000000000000000006044820152606401610361565b611c208110610bba5760405162461bcd60e51b815260206004820152601260248201527f45787069726520747320746f6f206c61746500000000000000000000000000006044820152606401610361565b73ffffffffffffffffffffffffffffffffffffffff602884901c16610be28888888885611168565b600088815260056020908152604080832080547fffffffffffffff000000000000000000000000000000000000000000000000001678ffffffffffffffffffffffffffffffffffffffffffffffffff891617905560ff8b16835290829052902054610c689073ffffffffffffffffffffffffffffffffffffffff168260a08b901c6112d8565b60405188907f5ce4019f772fda6cb703b26bce3ec3006eb36b73f1d3a0eb441213317d9f5e9d90600090a25050505050505050565b606060015b6101008160ff161015610d555760ff811660009081526020819052604090205473ffffffffffffffffffffffffffffffffffffffff16610d43578060ff1660011415610cec575090565b610cf76001826116a1565b60ff1667ffffffffffffffff811115610d1257610d12611742565b604051908082528060200260200182016040528015610d3b578160200160208202803683370190505b509150610d55565b80610d4d816116c4565b915050610ca2565b60015b8160ff168160ff161015610de55760ff811660009081526020819052604090205473ffffffffffffffffffffffffffffffffffffffff1683610d9b6001846116a1565b60ff1681518110610dae57610dae611713565b73ffffffffffffffffffffffffffffffffffffffff9092166020928302919091019091015280610ddd816116c4565b915050610d58565b505090565b73ffffffffffffffffffffffffffffffffffffffff8281166000908152600160209081526040808320549385168352600282528083205464ffffffffff1660289490941b65ff0000000000169390931782526004905220545b92915050565b6040805173ffffffffffffffffffffffffffffffffffffffff8481166024830152604480830185905283518084039091018152606490920183526020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fa9059cbb000000000000000000000000000000000000000000000000000000001790529151600092839290871691610ee091906115dd565b6000604051808303816000865af19150503d8060008114610f1d576040519150601f19603f3d011682016040523d82523d6000602084013e610f22565b606091505b5091509150818015610f4c575080511580610f4c575080806020019051810190610f4c9190611480565b610f985760405162461bcd60e51b815260206004820152600f60248201527f5472616e73666572206661696c656400000000000000000000000000000000006044820152606401610361565b5050505050565b73ffffffffffffffffffffffffffffffffffffffff81166110025760405162461bcd60e51b815260206004820152601e60248201527f5369676e65722063616e6e6f7420626520656d707479206164647265737300006044820152606401610361565b60008681526020868152604080832082527f5ef297f2881340f11ed62c7c08e0e0c235c333ad8f340d7285f529f16716968a8352808320815193845291830180825282905260ff85169083015260608201869052608082018590529060019060a0016020604051602081039080840390855afa158015611086573d6000803e3d6000fd5b5050506020604051035173ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614610a265760405162461bcd60e51b815260206004820152601160248201527f496e76616c6964207369676e61747572650000000000000000000000000000006044820152606401610361565b6000826111178382611672565b9150811015610e435760405162461bcd60e51b815260206004820152600860248201527f6f766572666c6f770000000000000000000000000000000000000000000000006044820152606401610361565b73ffffffffffffffffffffffffffffffffffffffff81166111cb5760405162461bcd60e51b815260206004820152601e60248201527f5369676e65722063616e6e6f7420626520656d707479206164647265737300006044820152606401610361565b6000858152602080822081527f9862d877599564bcd97c37305a7b0fdbe621d9c2a125026f2ad601f754a75abc82526040808320815193845291830180825282905260ff85169083015260608201869052608082018590529060019060a0016020604051602081039080840390855afa15801561124c573d6000803e3d6000fd5b5050506020604051035173ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16146112d05760405162461bcd60e51b815260206004820152601160248201527f496e76616c6964207369676e61747572650000000000000000000000000000006044820152606401610361565b505050505050565b600081116113285760405162461bcd60e51b815260206004820181905260248201527f416d6f756e74206d7573742062652067726561746572207468616e207a65726f6044820152606401610361565b6040517f23b872dd00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8381166004830152306024830152604482018390528416906323b872dd90606401602060405180830381600087803b15801561139e57600080fd5b505af11580156113b2573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906113d69190611480565b50505050565b803573ffffffffffffffffffffffffffffffffffffffff8116811461140057600080fd5b919050565b803564ffffffffff8116811461140057600080fd5b803560ff8116811461140057600080fd5b60006020828403121561143d57600080fd5b611446826113dc565b9392505050565b6000806040838503121561146057600080fd5b611469836113dc565b9150611477602084016113dc565b90509250929050565b60006020828403121561149257600080fd5b815161144681611771565b6000602082840312156114af57600080fd5b5035919050565b60008060008060008060c087890312156114cf57600080fd5b863595506020870135945060408701359350606087013592506114f46080880161141a565b915060a087013561150481611771565b809150509295509295509295565b600080600080600060a0868803121561152a57600080fd5b8535945060208601359350604086013592506115486060870161141a565b9150608086013578ffffffffffffffffffffffffffffffffffffffffffffffffff8116811461157657600080fd5b809150509295509295909350565b6000806040838503121561159757600080fd5b8235915061147760208401611405565b6000602082840312156115b957600080fd5b61144682611405565b6000602082840312156115d457600080fd5b6114468261141a565b6000825160005b818110156115fe57602081860181015185830152016115e4565b8181111561160d576000828501525b509190910192915050565b6020808252825182820181905260009190848201906040850190845b8181101561166657835173ffffffffffffffffffffffffffffffffffffffff1683529284019291840191600101611634565b50909695505050505050565b60008219821115611685576116856116e4565b500190565b60008282101561169c5761169c6116e4565b500390565b600060ff821660ff8416808210156116bb576116bb6116e4565b90039392505050565b600060ff821660ff8114156116db576116db6116e4565b60010192915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b801515811461177f57600080fd5b5056fea164736f6c6343000806000a";

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
