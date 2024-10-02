import { Address, Builder, Cell } from "@ton/core";

export type TokenTransfer = {
  $$type: 'TokenTransfer';
  query_id: bigint;
  amount: bigint;
  destination: Address;
  response_destination: Address | null;
  custom_payload: Cell | null;
  forward_ton_amount: bigint;
  forward_payload: Cell;
}

export function storeTokenTransfer(src: TokenTransfer) {
  return (builder: Builder) => {
      let b_0 = builder;
      b_0.storeUint(260734629, 32);
      b_0.storeUint(src.query_id, 64);
      b_0.storeCoins(src.amount);
      b_0.storeAddress(src.destination);
      b_0.storeAddress(src.response_destination);
      if (src.custom_payload !== null && src.custom_payload !== undefined) { b_0.storeBit(true).storeRef(src.custom_payload); } else { b_0.storeBit(false); }
      b_0.storeCoins(src.forward_ton_amount);
      b_0.storeBuilder(src.forward_payload.asBuilder());
  };
}

export type ProxyTokenTransfer = {
  $$type: 'ProxyTokenTransfer';
  wallet_address: Address;
  token_transfer: TokenTransfer;
}

export function storeProxyTokenTransfer(src: ProxyTokenTransfer) {
  return (builder: Builder) => {
      let b_0 = builder;
      b_0.storeUint(3761706239, 32);
      b_0.storeAddress(src.wallet_address);
      let b_1 = new Builder();
      b_1.store(storeTokenTransfer(src.token_transfer));
      b_0.storeRef(b_1.endCell());
  };
}

export type ModifySupportToken = {
  $$type: 'ModifySupportToken';
  available: boolean;
  token_index: bigint;
  token_master_address: Address;
  meson_wallet_address: Address;
}

export function storeModifySupportToken(src: ModifySupportToken) {
  return (builder: Builder) => {
      let b_0 = builder;
      b_0.storeUint(613687068, 32);
      b_0.storeBit(src.available);
      b_0.storeUint(src.token_index, 8);
      b_0.storeAddress(src.token_master_address);
      b_0.storeAddress(src.meson_wallet_address);
  };
}