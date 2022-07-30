/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  UCTUpgradeable,
  UCTUpgradeableInterface,
} from "../UCTUpgradeable";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "BeaconUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
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
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
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
        internalType: "address[]",
        name: "targets",
        type: "address[]",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "batchMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "targets",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    name: "batchMint2",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
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
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "minter",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
    ],
    name: "upgradeTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

const _bytecode =
  "0x60a06040523060601b60805234801561001757600080fd5b5060805160601c6120f161004b600039600081816104820152818161051d015281816106a2015261073801526120f16000f3fe6080604052600436106100f35760003560e01c806370a082311161008a578063a9059cbb11610059578063a9059cbb1461029b578063c4d66de8146102bb578063ce052063146102db578063dd62ed3e146102fb57600080fd5b806370a082311461020357806383b74baa1461024657806395d89b4114610266578063a457c2d71461027b57600080fd5b8063313ce567116100c6578063313ce567146101925780633659cfe6146101ae57806339509351146101d05780634f1ef286146101f057600080fd5b806306fdde03146100f8578063095ea7b31461012357806318160ddd1461015357806323b872dd14610172575b600080fd5b34801561010457600080fd5b5061010d61031b565b60405161011a9190611e78565b60405180910390f35b34801561012f57600080fd5b5061014361013e366004611d2b565b6103ad565b604051901515815260200161011a565b34801561015f57600080fd5b506099545b60405190815260200161011a565b34801561017e57600080fd5b5061014361018d366004611c2b565b6103c4565b34801561019e57600080fd5b506040516004815260200161011a565b3480156101ba57600080fd5b506101ce6101c9366004611bdd565b61046a565b005b3480156101dc57600080fd5b506101436101eb366004611d2b565b610641565b6101ce6101fe366004611c67565b61068a565b34801561020f57600080fd5b5061016461021e366004611bdd565b73ffffffffffffffffffffffffffffffffffffffff1660009081526097602052604090205490565b34801561025257600080fd5b506101ce610261366004611e17565b61084d565b34801561027257600080fd5b5061010d61099d565b34801561028757600080fd5b50610143610296366004611d2b565b6109ac565b3480156102a757600080fd5b506101436102b6366004611d2b565b610a6a565b3480156102c757600080fd5b506101ce6102d6366004611bdd565b610a77565b3480156102e757600080fd5b506101ce6102f6366004611d55565b610c1e565b34801561030757600080fd5b50610164610316366004611bf8565b610d82565b6060609a805461032a90611f80565b80601f016020809104026020016040519081016040528092919081815260200182805461035690611f80565b80156103a35780601f10610378576101008083540402835291602001916103a3565b820191906000526020600020905b81548152906001019060200180831161038657829003601f168201915b5050505050905090565b60006103ba338484610e07565b5060015b92915050565b60cb54600090339073ffffffffffffffffffffffffffffffffffffffff1681148015610421575073ffffffffffffffffffffffffffffffffffffffff80861660009081526098602090815260408083209385168352929052205483115b15610454577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff610452868383610e07565b505b61045f858585610f86565b9150505b9392505050565b3073ffffffffffffffffffffffffffffffffffffffff7f000000000000000000000000000000000000000000000000000000000000000016141561051b5760405162461bcd60e51b815260206004820152602c60248201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060448201527f64656c656761746563616c6c000000000000000000000000000000000000000060648201526084015b60405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166105907f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffffffffffffffffffffffffffffffffffffff1690565b73ffffffffffffffffffffffffffffffffffffffff16146106195760405162461bcd60e51b815260206004820152602c60248201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060448201527f6163746976652070726f787900000000000000000000000000000000000000006064820152608401610512565b61062281611052565b6040805160008082526020820190925261063e918391906110cf565b50565b33600081815260986020908152604080832073ffffffffffffffffffffffffffffffffffffffff8716845290915281205490916103ba918590610685908690611f3c565b610e07565b3073ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001614156107365760405162461bcd60e51b815260206004820152602c60248201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060448201527f64656c656761746563616c6c00000000000000000000000000000000000000006064820152608401610512565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166107ab7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffffffffffffffffffffffffffffffffffffff1690565b73ffffffffffffffffffffffffffffffffffffffff16146108345760405162461bcd60e51b815260206004820152602c60248201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060448201527f6163746976652070726f787900000000000000000000000000000000000000006064820152608401610512565b61083d82611052565b610849828260016110cf565b5050565b60ca5473ffffffffffffffffffffffffffffffffffffffff1633146108b45760405162461bcd60e51b815260206004820152601760248201527f43616c6c6572206973206e6f7420746865206f776e65720000000000000000006044820152606401610512565b60008251116109055760405162461bcd60e51b815260206004820152601560248201527f54617267657420617272617920697320656d70747900000000000000000000006044820152606401610512565b6108008251106109575760405162461bcd60e51b815260206004820152601960248201527f54617267657420617272617920697320746f6f206c61726765000000000000006044820152606401610512565b60005b8251811015610998576109868382815181106109785761097861203c565b602002602001015183611314565b8061099081611fd4565b91505061095a565b505050565b6060609b805461032a90611f80565b33600090815260986020908152604080832073ffffffffffffffffffffffffffffffffffffffff8616845290915281205482811015610a535760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760448201527f207a65726f0000000000000000000000000000000000000000000000000000006064820152608401610512565b610a603385858403610e07565b5060019392505050565b60006103ba33848461141a565b600054610100900460ff16610a925760005460ff1615610a96565b303b155b610b085760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201527f647920696e697469616c697a65640000000000000000000000000000000000006064820152608401610512565b600054610100900460ff16158015610b4757600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000166101011790555b610b9e6040518060600160405280602381526020016120c2602391396040518060400160405280600381526020017f5543540000000000000000000000000000000000000000000000000000000000815250611681565b60c98054337fffffffffffffffffffffffff00000000000000000000000000000000000000009182161790915560ca805490911673ffffffffffffffffffffffffffffffffffffffff8416179055801561084957600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff1690555050565b60ca5473ffffffffffffffffffffffffffffffffffffffff163314610c855760405162461bcd60e51b815260206004820152601760248201527f43616c6c6572206973206e6f7420746865206f776e65720000000000000000006044820152606401610512565b6000825111610cd65760405162461bcd60e51b815260206004820152601560248201527f54617267657420617272617920697320656d70747900000000000000000000006044820152606401610512565b610800825110610d285760405162461bcd60e51b815260206004820152601960248201527f54617267657420617272617920697320746f6f206c61726765000000000000006044820152606401610512565b60005b825181101561099857610d70838281518110610d4957610d4961203c565b6020026020010151838381518110610d6357610d6361203c565b6020026020010151611314565b80610d7a81611fd4565b915050610d2b565b60cb5460009073ffffffffffffffffffffffffffffffffffffffff83811691161415610dcf57507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6103be565b73ffffffffffffffffffffffffffffffffffffffff808416600090815260986020908152604080832093861683529290522054610463565b73ffffffffffffffffffffffffffffffffffffffff8316610e8f5760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460448201527f72657373000000000000000000000000000000000000000000000000000000006064820152608401610512565b73ffffffffffffffffffffffffffffffffffffffff8216610f185760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f20616464726560448201527f73730000000000000000000000000000000000000000000000000000000000006064820152608401610512565b73ffffffffffffffffffffffffffffffffffffffff83811660008181526098602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6000610f9384848461141a565b73ffffffffffffffffffffffffffffffffffffffff841660009081526098602090815260408083203384529091529020548281101561103a5760405162461bcd60e51b815260206004820152602860248201527f45524332303a207472616e7366657220616d6f756e742065786365656473206160448201527f6c6c6f77616e63650000000000000000000000000000000000000000000000006064820152608401610512565b6110478533858403610e07565b506001949350505050565b60c95473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461063e5760405162461bcd60e51b815260206004820152600c60248201527f556e617574686f72697a656400000000000000000000000000000000000000006044820152606401610512565b600061110f7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffffffffffffffffffffffffffffffffffffff1690565b905061111a84611710565b6000835111806111275750815b156111385761113684846117ea565b505b7f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd9143805460ff1661130d5780547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0016600117815560405173ffffffffffffffffffffffffffffffffffffffff8316602482015261122e908690604401604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167f3659cfe6000000000000000000000000000000000000000000000000000000001790526117ea565b5080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001681557f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffffffffffffffffffffffffffffffffffffff8381169116146113045760405162461bcd60e51b815260206004820152602f60248201527f45524331393637557067726164653a207570677261646520627265616b73206660448201527f75727468657220757067726164657300000000000000000000000000000000006064820152608401610512565b61130d856118f9565b5050505050565b73ffffffffffffffffffffffffffffffffffffffff82166113775760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f2061646472657373006044820152606401610512565b80609960008282546113899190611f3c565b909155505073ffffffffffffffffffffffffffffffffffffffff8216600090815260976020526040812080548392906113c3908490611f3c565b909155505060405181815273ffffffffffffffffffffffffffffffffffffffff8316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b73ffffffffffffffffffffffffffffffffffffffff83166114a35760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f20616460448201527f64726573730000000000000000000000000000000000000000000000000000006064820152608401610512565b73ffffffffffffffffffffffffffffffffffffffff821661152c5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201527f65737300000000000000000000000000000000000000000000000000000000006064820152608401610512565b73ffffffffffffffffffffffffffffffffffffffff8316600090815260976020526040902054818110156115c85760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e742065786365656473206260448201527f616c616e636500000000000000000000000000000000000000000000000000006064820152608401610512565b73ffffffffffffffffffffffffffffffffffffffff80851660009081526097602052604080822085850390559185168152908120805484929061160c908490611f3c565b925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161167291815260200190565b60405180910390a35b50505050565b600054610100900460ff166116fe5760405162461bcd60e51b815260206004820152602b60248201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960448201527f6e697469616c697a696e670000000000000000000000000000000000000000006064820152608401610512565b611706611946565b61084982826119c5565b803b6117845760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201527f6f74206120636f6e7472616374000000000000000000000000000000000000006064820152608401610512565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055565b6060823b6118605760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60448201527f6e747261637400000000000000000000000000000000000000000000000000006064820152608401610512565b6000808473ffffffffffffffffffffffffffffffffffffffff16846040516118889190611e5c565b600060405180830381855af49150503d80600081146118c3576040519150601f19603f3d011682016040523d82523d6000602084013e6118c8565b606091505b50915091506118f0828260405180606001604052806027815260200161209b60279139611a69565b95945050505050565b61190281611710565b60405173ffffffffffffffffffffffffffffffffffffffff8216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b600054610100900460ff166119c35760405162461bcd60e51b815260206004820152602b60248201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960448201527f6e697469616c697a696e670000000000000000000000000000000000000000006064820152608401610512565b565b600054610100900460ff16611a425760405162461bcd60e51b815260206004820152602b60248201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960448201527f6e697469616c697a696e670000000000000000000000000000000000000000006064820152608401610512565b8151611a5590609a906020850190611aa2565b50805161099890609b906020840190611aa2565b60608315611a78575081610463565b825115611a885782518084602001fd5b8160405162461bcd60e51b81526004016105129190611e78565b828054611aae90611f80565b90600052602060002090601f016020900481019282611ad05760008555611b16565b82601f10611ae957805160ff1916838001178555611b16565b82800160010185558215611b16579182015b82811115611b16578251825591602001919060010190611afb565b50611b22929150611b26565b5090565b5b80821115611b225760008155600101611b27565b803573ffffffffffffffffffffffffffffffffffffffff81168114611b5f57600080fd5b919050565b600082601f830112611b7557600080fd5b81356020611b8a611b8583611f18565b611ec9565b80838252828201915082860187848660051b8901011115611baa57600080fd5b60005b85811015611bd057611bbe82611b3b565b84529284019290840190600101611bad565b5090979650505050505050565b600060208284031215611bef57600080fd5b61046382611b3b565b60008060408385031215611c0b57600080fd5b611c1483611b3b565b9150611c2260208401611b3b565b90509250929050565b600080600060608486031215611c4057600080fd5b611c4984611b3b565b9250611c5760208501611b3b565b9150604084013590509250925092565b60008060408385031215611c7a57600080fd5b611c8383611b3b565b915060208084013567ffffffffffffffff80821115611ca157600080fd5b818601915086601f830112611cb557600080fd5b813581811115611cc757611cc761206b565b611cf7847fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f84011601611ec9565b91508082528784828501011115611d0d57600080fd5b80848401858401376000848284010152508093505050509250929050565b60008060408385031215611d3e57600080fd5b611d4783611b3b565b946020939093013593505050565b60008060408385031215611d6857600080fd5b823567ffffffffffffffff80821115611d8057600080fd5b611d8c86838701611b64565b9350602091508185013581811115611da357600080fd5b85019050601f81018613611db657600080fd5b8035611dc4611b8582611f18565b80828252848201915084840189868560051b8701011115611de457600080fd5b600094505b83851015611e07578035835260019490940193918501918501611de9565b5080955050505050509250929050565b60008060408385031215611e2a57600080fd5b823567ffffffffffffffff811115611e4157600080fd5b611e4d85828601611b64565b95602094909401359450505050565b60008251611e6e818460208701611f54565b9190910192915050565b6020815260008251806020840152611e97816040850160208701611f54565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169190910160400192915050565b604051601f82017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016810167ffffffffffffffff81118282101715611f1057611f1061206b565b604052919050565b600067ffffffffffffffff821115611f3257611f3261206b565b5060051b60200190565b60008219821115611f4f57611f4f61200d565b500190565b60005b83811015611f6f578181015183820152602001611f57565b8381111561167b5750506000910152565b600181811c90821680611f9457607f821691505b60208210811415611fce577f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b50919050565b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8214156120065761200661200d565b5060010190565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fdfe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c656455534420436f75706f6e20546f6b656e202868747470733a2f2f6d65736f6e2e666929a164736f6c6343000806000a";

type UCTUpgradeableConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: UCTUpgradeableConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class UCTUpgradeable__factory extends ContractFactory {
  constructor(...args: UCTUpgradeableConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<UCTUpgradeable> {
    return super.deploy(overrides || {}) as Promise<UCTUpgradeable>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): UCTUpgradeable {
    return super.attach(address) as UCTUpgradeable;
  }
  connect(signer: Signer): UCTUpgradeable__factory {
    return super.connect(signer) as UCTUpgradeable__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): UCTUpgradeableInterface {
    return new utils.Interface(_abi) as UCTUpgradeableInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): UCTUpgradeable {
    return new Contract(address, _abi, signerOrProvider) as UCTUpgradeable;
  }
}
