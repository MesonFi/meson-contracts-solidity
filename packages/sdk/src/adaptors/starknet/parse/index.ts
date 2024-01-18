import { utils } from 'ethers'
import { CallData } from 'starknet'
import v0 from './v0.json'
import v1 from './v1.json'

export default function parse(calldata) {
  try {
    return parse_v0(calldata)
  } catch {
    return parse_v1(calldata)
  }
}

const parser_v0 = new CallData(v0)
function parse_v0(calldata) {
  const result = parser_v0.parse('__execute__', calldata)
  const { calls, data } = result as { calls: any[], data: bigint[] }
  return calls.map(({ to, selector, offset, len }) => ({
    to: utils.hexZeroPad(to, 32),
    selector: utils.hexZeroPad(selector, 32),
    data: data.slice(Number(offset), Number(offset) + Number(len)).map(x => utils.hexlify(x))
  }))
}

const parser_v1 = new CallData(v1)
function parse_v1(calldata) {
  const result = parser_v1.parse('__execute__', calldata)
  return (result as any).calls.map(({ to, selector, data }) => ({
    to: utils.hexZeroPad(to, 32),
    selector: utils.hexZeroPad(selector, 32),
    data: data.map(x => utils.hexlify(x))
  }))
}
