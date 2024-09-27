import { KeyPair, keyPairFromSecretKey, mnemonicToPrivateKey } from '@ton/crypto'
import TonAdaptor from "./TonAdaptor";
import TonWallet from "./TonWallet";

export function getWallet(privateKey: string, adaptor: TonAdaptor, Wallet = TonWallet): TonWallet {
  // Notice that TON_PRIVATE_KEY has 64 bytes
  const derivedKey = privateKey.startsWith('0x') ? 
    privateKey.substring(2) + privateKey.substring(2) : privateKey + privateKey
  const keypair = keyPairFromSecretKey(Buffer.from(derivedKey, 'hex'))
  return new Wallet(adaptor, keypair)
}

export function getContract(address: string, abi, adaptor: TonAdaptor) {
  return new Proxy({}, {
    get(target, prop: string) {
      if (prop === 'address') {
        return address
      } else if (prop === 'provider') {
        return adaptor
      } else if (prop === 'signer') {
        if (adaptor instanceof TonWallet) {
          return adaptor
        }
        throw new Error(`TonContract doesn't have a signer.`)
      } else if (prop === 'interface') {
        throw new Error(`TODO: Unimplemented`)
      } else {
        throw new Error(`TODO: Unimplemented`)
      }
    }
  })
}

export function formatAddress(addr: string) {
  return addr // TODO
}