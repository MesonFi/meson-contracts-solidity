import { ethers, waffle } from 'hardhat'
import { MesonStatesTest } from '@mesonfi/contract-types'

import { expect } from './shared/expect'

const token = '0x243f22fbd4c375581aaacfcfff5a43793eb8a74d'

describe('MesonStates', () => {
  let contract: MesonStatesTest
  const fixture = async () => {
    const factory = await ethers.getContractFactory('MesonStatesTest')
    return (await factory.deploy(token)) as MesonStatesTest
  }

  beforeEach('deploy MesonStatesTest', async () => {
    contract = await waffle.loadFixture(fixture)
  })
})
