/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "IBeaconUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IBeaconUpgradeable__factory>;
    getContractFactory(
      name: "ERC1967UpgradeUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC1967UpgradeUpgradeable__factory>;
    getContractFactory(
      name: "UUPSUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.UUPSUpgradeable__factory>;
    getContractFactory(
      name: "ERC20Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20Upgradeable__factory>;
    getContractFactory(
      name: "IERC20MetadataUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20MetadataUpgradeable__factory>;
    getContractFactory(
      name: "IERC20Upgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Upgradeable__factory>;
    getContractFactory(
      name: "ERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20__factory>;
    getContractFactory(
      name: "IERC20Metadata",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Metadata__factory>;
    getContractFactory(
      name: "IERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20__factory>;
    getContractFactory(
      name: "IERC20Minimal",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Minimal__factory>;
    getContractFactory(
      name: "Meson",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Meson__factory>;
    getContractFactory(
      name: "IMesonPoolsEvents",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IMesonPoolsEvents__factory>;
    getContractFactory(
      name: "MesonPools",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MesonPools__factory>;
    getContractFactory(
      name: "IMesonSwapEvents",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IMesonSwapEvents__factory>;
    getContractFactory(
      name: "MesonSwap",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MesonSwap__factory>;
    getContractFactory(
      name: "MesonPoolsTest",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MesonPoolsTest__factory>;
    getContractFactory(
      name: "MesonStatesTest",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MesonStatesTest__factory>;
    getContractFactory(
      name: "MesonSwapTest",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MesonSwapTest__factory>;
    getContractFactory(
      name: "MockToken",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MockToken__factory>;
    getContractFactory(
      name: "SampleThirdPartyDapp",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.SampleThirdPartyDapp__factory>;
    getContractFactory(
      name: "UCTUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.UCTUpgradeable__factory>;
    getContractFactory(
      name: "UpgradableMeson",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.UpgradableMeson__factory>;
    getContractFactory(
      name: "IERC20Minimal",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Minimal__factory>;
    getContractFactory(
      name: "ITransferWithBeneficiary",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ITransferWithBeneficiary__factory>;
    getContractFactory(
      name: "MesonHelpers",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MesonHelpers__factory>;
    getContractFactory(
      name: "MesonStates",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MesonStates__factory>;
    getContractFactory(
      name: "MesonTokens",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MesonTokens__factory>;

    getContractAt(
      name: "IBeaconUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IBeaconUpgradeable>;
    getContractAt(
      name: "ERC1967UpgradeUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC1967UpgradeUpgradeable>;
    getContractAt(
      name: "UUPSUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.UUPSUpgradeable>;
    getContractAt(
      name: "ERC20Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20Upgradeable>;
    getContractAt(
      name: "IERC20MetadataUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20MetadataUpgradeable>;
    getContractAt(
      name: "IERC20Upgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Upgradeable>;
    getContractAt(
      name: "ERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20>;
    getContractAt(
      name: "IERC20Metadata",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Metadata>;
    getContractAt(
      name: "IERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20>;
    getContractAt(
      name: "IERC20Minimal",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Minimal>;
    getContractAt(
      name: "Meson",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Meson>;
    getContractAt(
      name: "IMesonPoolsEvents",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IMesonPoolsEvents>;
    getContractAt(
      name: "MesonPools",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MesonPools>;
    getContractAt(
      name: "IMesonSwapEvents",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IMesonSwapEvents>;
    getContractAt(
      name: "MesonSwap",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MesonSwap>;
    getContractAt(
      name: "MesonPoolsTest",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MesonPoolsTest>;
    getContractAt(
      name: "MesonStatesTest",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MesonStatesTest>;
    getContractAt(
      name: "MesonSwapTest",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MesonSwapTest>;
    getContractAt(
      name: "MockToken",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MockToken>;
    getContractAt(
      name: "SampleThirdPartyDapp",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.SampleThirdPartyDapp>;
    getContractAt(
      name: "UCTUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.UCTUpgradeable>;
    getContractAt(
      name: "UpgradableMeson",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.UpgradableMeson>;
    getContractAt(
      name: "IERC20Minimal",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Minimal>;
    getContractAt(
      name: "ITransferWithBeneficiary",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ITransferWithBeneficiary>;
    getContractAt(
      name: "MesonHelpers",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MesonHelpers>;
    getContractAt(
      name: "MesonStates",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MesonStates>;
    getContractAt(
      name: "MesonTokens",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MesonTokens>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
  }
}
