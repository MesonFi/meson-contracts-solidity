import { MesonStatesTest } from "@mesonfi/contract-types";
import { ethers, waffle } from "hardhat";
import { expect } from "./shared/expect";

describe("MesonHelpers", () => {

  let mesonInstance: MesonStatesTest;

  const fixture = async () => {
    const factory = await ethers.getContractFactory("MesonStatesTest");
    return (await factory.deploy()) as MesonStatesTest;
  };

  beforeEach("deploy MesonStatesTest", async () => {
    mesonInstance = await waffle.loadFixture(fixture);
  });

  describe("#getShortCoinType", () => {
    it("returns shortCoinType", async () => {
      expect(await mesonInstance.getShortCoinType()).to.eq("0x003c");
    });
  });
});
