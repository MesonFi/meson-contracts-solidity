const { ethers } = require('hardhat')

const token = [
  '0xcf1511622929f4ba960dfa9b24be84a8fc620bd5'
]

async function main() {
  const Meson = await ethers.getContractFactory('Meson')
  console.log('Deploying Meson...')
  const deployed = await Meson.deploy(tokens)
  console.log('Meson deployed to:', deployed.address)
}

main()
