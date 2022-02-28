import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { solidity } from 'ethereum-waffle'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'

use(chaiAsPromised)
use(solidity)
use(jestSnapshotPlugin())

export { expect }