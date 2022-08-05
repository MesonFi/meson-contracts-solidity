# Meson Smart Contract in Solidity

This repository contains the Solidity implementation for the Meson protocol.
See [Meson Docs](https://docs.meson.fi/protocol/background) for the design details of Meson.

## Local development

This repo includes Meson's smart contracts in Solidity for deployment to multiple EVM-compatible blockchains. It also includes Meson JS SDKs in the `packages` folder for integrating into other Meson projects to interact with Meson contracts.

Run `yarn` to install the dependencies. Because the contracts of this project need to be deployed on different chains, the project provides a script to switch current chain. Before the first time of compilation, run `yarn chain:eth` to initialize contracts to Ethereum blockchain. See `packages.json` and look for scripts of `chain:[id]` for other commands that switch the project to other chains.

### Run tests

Test cases are given in the `tests` folder. Before running the test, please run `yarn build:packages` to build Meson SDKs which are used by contract tests. Then, run `yarn test` to perform tests for Meson contracts. Notice that the test script will switch the current chain to Ethereum testnet because the Meson contract tests should be run under this condition.

The core Meson SDK `@mesonfi/sdk` also provides test cases. Go to `packages/sdk` and run `yarn test` to perform tests for it. SDK tests also requires Ethereum environment so make sure the current chain is switched Ethereum.

### Generate docs

Run `yarn docgen` to generate docs for Meson smart contracts, which are extracted from comments in the contract source codes. See generated docs under the `docs` folder.

### Estimate gas consumptions

This project provides two scripts to estimate gas consumptions for crucial methos of Meson. Run `yarn estimate` to estimate the normal deployed Meson contracts, and run `yarn estiamte-upgradable` to estimate in the case Meson is deployed as an upgradable contract.

## Deployment
