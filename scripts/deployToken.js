const { ethers } = require('hardhat')


async function main() {
  const MockToken = await ethers.getContractFactory('MockToken')
  console.log('Deploying MockToken...')
  const deployed = await MockToken.deploy("MesonToken","mtk",1000000000)
  console.log('Meson deployed to:', deployed.address)
}

main()
