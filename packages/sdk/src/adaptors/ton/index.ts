import { KeyPair, keyPairFromSecretKey, mnemonicToPrivateKey } from '@ton/crypto'
import TonAdaptor from "./TonAdaptor";
import TonWallet from "./TonWallet";

export async function getWallet(privateKey: string | Buffer, client: TonAdaptor): Promise<TonWallet> {
  let keypair: KeyPair
  if (privateKey instanceof Buffer) {
    // Buffer secret key
    keypair = keyPairFromSecretKey(privateKey)
  } else {
    // Hex private key
    keypair = keyPairFromSecretKey(Buffer.from(privateKey.startsWith('0x') ? 
      privateKey.substring(2) : privateKey, 'hex'))
  }
  return new TonWallet(client, keypair)
}
