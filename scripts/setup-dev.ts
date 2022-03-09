import { AddressZero } from "@ethersproject/constants";
import { Meson } from '@mesonfi/contract-types';
import { MesonClient } from '@mesonfi/sdk';
import { Wallet } from "ethers";
import { ethers, upgrades } from 'hardhat';

const { formatEther, parseEther, parseUnits } = ethers.utils;

(async function () {
  const signer0 = (await ethers.getSigners())[0];

  const provider = ethers.provider;
  // Key1 0x5d776fc31d3c6da41de641af38323a27c8896f7a
  // const signer1 = new Wallet('0x6539a945be6c822a780d41ecf92b53aaef4bf037df7d1b094b67a689553bd722', provider);
  const signer1 = signer0;
  // Key2 0xe17e4772e395b2575b50609719653a495ba756c9
  const signer2 = new Wallet('0xb8823b531f8ffcadea254b039b25ae6dc99504c8d42a79a5e1bdb6316eab6683', provider);
  // Key3 0x54a4c26b2b7720a6e86ee6a6de6375bc0730cee4
  const signer3 = new Wallet('0xcc315983a2f1305ecf72eab04fa3966e17bdf69836e42363594a94548562f986', provider);
  console.log(`Deployer: ${signer1.address} with balance ${formatEther(await signer1.getBalance())}`);

  // Prepare all signers to have enough eths
  // Assume signer1 is the initial deployer who has infinity balance
  const oneEth = parseEther("1000.0");
  if ((await signer2.getBalance()).lt(oneEth)) {
    console.log(`Transferring 1 eth from signer1 to signer2...`);
    const tx = await signer1.sendTransaction({ to: signer2.address, value: oneEth });
    await tx.wait();
  }
  if ((await signer3.getBalance()).lt(oneEth)) {
    console.log(`Transferring 1 eth from signer1 to signer3...`);
    const tx = await signer1.sendTransaction({ to: signer3.address, value: oneEth });
    await tx.wait();
  }

  // Deploy contracts
  const MockToken = await ethers.getContractFactory('MockToken', signer1);
  const UpgradableMeson = await ethers.getContractFactory('UpgradableMeson', signer1)

  console.log('Deploying tDAI...');
  const tDAIContract = await MockToken.deploy("testDAI", "tDAI", 10n ** 10n, 6); // $10000
  console.log('Deploying tUSDT...');
  const tUSDTContract = await MockToken.deploy("testUSDT", "tUSDT", 10n ** 22n, 18); // $10000
  console.log('Deploying Meson...');
  const MesonContract = await upgrades.deployProxy(
    UpgradableMeson,
    [[tDAIContract.address, tUSDTContract.address]],
    { kind: 'uups' }
  ) as Meson;
  await MesonContract.deployed();

  console.log(`Copy followings to your .env:`);
  console.log(``);
  console.log(`MESON_CONTRACT_ADDRESS = ${MesonContract.address}`);
  console.log(`TDAI_CONTRACT_ADDRESS = ${tDAIContract.address}`);
  console.log(`TUSDT_CONTRACT_ADDRESS = ${tUSDTContract.address}`);
  console.log(``);

  // Prepare all signers to have enough coins
  const oneThousandCoin = parseUnits("1000", 6);
  console.log(`Trasfer $1000 tDAI for signer2...`);
  await (await tDAIContract.connect(signer1).transfer(signer2.address, oneThousandCoin)).wait();
  console.log(`Trasfer $1000 tUSDT for signer3...`);
  await (await tUSDTContract.connect(signer1).transfer(signer3.address, oneThousandCoin)).wait();

  // Deposit and approve
  console.log('Signer2 deposit $1000 tDAI...');
  await (await tDAIContract.connect(signer2).approve(MesonContract.address, oneThousandCoin)).wait();
  console.log('Signer3 approve $100 tUSDT...')
  await (await tUSDTContract.connect(signer3).approve(MesonContract.address, oneThousandCoin)).wait();

  if (!(await MesonContract.indexOfAddress(signer2.address))) {
    console.log('Signer2 registering...');
    for (let index = 1; index < 10; index++) {
      const addr = await MesonContract.addressOfIndex(index.toString());
      if (addr === AddressZero) {
        console.log(`Deposit and register at ${index}...`);
        const client = await MesonClient.Create(MesonContract.connect(signer2));
        await (await client.depositAndRegister(tDAIContract.address, oneThousandCoin.toString(), index.toString())).wait();
        break;
      }
      console.log(`Already registered: ${index} => ${addr}`);
    }
  }
})()
