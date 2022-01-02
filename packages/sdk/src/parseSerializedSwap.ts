import { SwapSigner } from './SwapSigner'
import { SignedSwapRequest, SignedSwapRequestData } from './SignedSwapRequest'

export function parseSerializedSwap(serialized: string) {
  let parsed: SignedSwapRequestData
  try {
    parsed = JSON.parse(serialized)
  } catch {
    throw new Error('Invalid json string')
  }

  if (!parsed.chainId) {
    throw new Error('Missing chain id')
  } else if (!parsed.mesonAddress) {
    throw new Error('Missing meson contract address')
  } else if (!parsed.signature) {
    throw new Error('Missing signature')
  }

  const signer = new SwapSigner(parsed.mesonAddress, Number(parsed.chainId))
  const recovered = signer.recoverFromRequestSignature(parsed.encoded, parsed.signature)
  if (recovered !== parsed.initiator) {
    throw new Error('Invalid signature')
  }

  const swap = new SignedSwapRequest(parsed)
  if (swap.encode() !== parsed.encoded) {
    throw new Error('Encoded value mismatch')
  }

  return swap
}
