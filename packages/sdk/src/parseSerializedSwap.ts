import { SignedSwapRequest, SignedSwapRequestData } from './SignedSwapRequest'

export function parseSerializedSwap(serialized: string) {
  try {
    const parsed: SignedSwapRequestData = JSON.parse(serialized)
    return new SignedSwapRequest(parsed)
  } catch {
    throw new Error('Invalid json string')
  }
}
