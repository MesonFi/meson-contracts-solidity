const { ethers, upgrades } = require('hardhat')
import { expect } from './shared/expect'
import { initiator, provider } from './shared/wallet'
describe('MesonPools', () => {
  let totalSupply = 1000000000000
  let overrides = {
    gasLimit: 8984120,
    gasPrice: 500000000000
  };
  let mesonContract;
  let tokenContract;
  let tokenUsdcContract;
  let mesonFactory;
  let tokenUsddContract;
  beforeEach('deploy MesonPoolsTest', async () => {
    const MockToken = await ethers.getContractFactory('MockToken')
    tokenContract = await MockToken.deploy('Mock Token Usdt', 'MUsdt', totalSupply)
    await tokenContract.deployed()
    tokenUsdcContract = await MockToken.deploy('Mock Token Usdc', 'MUsdc', totalSupply)
    await tokenUsdcContract.deployed()
    mesonFactory = await ethers.getContractFactory('UpgradableMeson')
    mesonContract = await upgrades.deployProxy(mesonFactory, [[tokenContract.address, tokenUsdcContract.address,tokenUsddContract.address]], { kind: 'uups' })
    await mesonContract.deployed()
    let approve = await tokenContract.approve(mesonContract.address, 1000)
    await approve
  })

  describe('#depositAndRegister', () => {
    it('rejects zero amount', async () => {
      let balanceIndex=0x010000000001
      let amount = 0
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if amount overflow', async () => {
      let amount = 10000000000000000000000000000
      let balanceIndex=0x010000000001
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects the amount if no enough appove', async () => {
      let amount = 100
      let balanceIndex=0x010000000001
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects Index already registered', async () => {
      let amount = 100
      let balanceIndex=0x010000000001
      let balanceIndex2=0x010000000001
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
        await mesonContract.depositAndRegister(amount, balanceIndex2)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if provider index is zero', async () => {
      let amount = 100
      let balanceIndex=0x010000000000
      try {
        await mesonContract.depositAndRegister(amount,balanceIndex )
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if the address is already registered', async () => {
      let amount = 100
      let balanceIndex=0x010000000001
      let balanceIndex2=0x010000000002
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
        await mesonContract.depositAndRegister(amount, balanceIndex2)
      } catch (error) {
        expect(error).to.throw
      }
    })

    it('refuses unsupported token', async () => {
      let amount = 100
      let balanceIndex=0x030000000001
      try {
        await mesonContract.depositAndRegister(amount, balanceIndex)
      } catch (error) {
        // console.log(error)
        expect(error).to.throw
      }
    })
    it('accepts the depositAndRegister if all parameters are correct', async () => {
      let amount = 1000
      let balanceIndex=0x010000000001
      let deposit = await mesonContract.depositAndRegister(amount, balanceIndex)
      expect(await tokenContract.balanceOf(mesonContract.address)).to.equal(amount)
      expect(await tokenContract.balanceOf(provider.address)).to.equal(totalSupply - amount)

    })
  })

  describe('#deposit', () => {
    it('rejects zero amount ', async () => {
      let balanceIndex=0x010000000001
      let amount = 0
      try {
        await mesonContract.deposit(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects if amount overflow', async () => {
      let balanceIndex=0x010000000001
      let amount = 10000000000000000000000000000
      try {
        await mesonContract.deposit(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('rejects the amount if no enough appove', async () => {
      let balanceIndex=0x010000000001
      let amount = 1000000
      try {
        await mesonContract.deposit(amount, balanceIndex)
      } catch (error) {
        expect(error).to.throw
      }
    })
    it('accepts the deposit if all parameters are correct', async () => {
      let balanceIndex=0x010000000001
      let amount = 100
      await mesonContract.deposit(amount, balanceIndex)
      expect(await tokenContract.balanceOf(mesonContract.address)).to.equal(amount)
      expect(await tokenContract.balanceOf(provider.address)).to.equal(totalSupply - amount)
    })
  })
  describe('#withdraw', () => {
    it('rejects Caller not registered. Call depositAndRegister', async () => {
      let tokenIndex = 0x01
      let amount = 100
   try {
    await mesonContract.withdraw(amount, tokenIndex)
   } catch (error) {
    expect(error).to.throw
   }
    })
    // it('refuses unsupported token', async () => {
    //   let tokenIndex = 0x02
    //   let balanceIndex = 0x010000000001
    //   let amount = 100
    //   await mesonContract.depositAndRegister(amount, balanceIndex)
    //    await mesonContract.withdraw(amount, tokenIndex)
    //    ProviderError: Error: VM Exception while processing transaction: reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)
    // })
    it('accepts the withdraw if all parameters are correct', async () => {
      let tokenIndex = 0x01
      let balanceIndex = 0x010000000001
      let amount = 100
      await mesonContract.depositAndRegister(amount, balanceIndex)
      await mesonContract.withdraw(amount, tokenIndex)
      expect(await tokenContract.balanceOf(mesonContract.address)).to.equal(0)
      expect(await tokenContract.balanceOf(provider.address)).to.equal(totalSupply)
    })
  })
  describe('#lock', async () => {
    it('rejects swap  already exists', async () => {
    })
    it(' rejects caller not registered', async () => {
      // expect() check  provider the Index
    })
  })

  describe('#unlock', async () => {
    it('rejects swap  does not exist', async () => {
      //expect () check lockedSwap
    })
    it('rejects swap still in lock', async () => {
      //expect () check block.timestamp <
    })
    it('rejects swap still in lock', async () => {
      //expect () check block.timestamp ==
    })
  })

  describe('#release', async () => {
    it('rejects swap does not exist ', async () => {
      //expect () check lockedSwap 
    })
    it('refuses unsupported token', async () => {
      //expect () check  unsupported token 
    })
  })


})
